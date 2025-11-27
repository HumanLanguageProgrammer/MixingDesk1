// src/lib/voice.ts
// Client-side functions for voice API (STT + TTS)

import type { STTResponse, EmotionalDelivery } from '../types';

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Send audio for speech-to-text processing with emotion detection
 */
export async function speechToText(audioBlob: Blob): Promise<STTResponse> {
  // Convert blob to base64 for reliable serverless transmission
  const audioBase64 = await blobToBase64(audioBlob);

  // Debug: Check first few chars of base64 (valid webm should start with "GkXf" or similar)
  const base64Preview = audioBase64.substring(0, 20);

  console.log('Sending audio to STT:', {
    originalSize: audioBlob.size,
    base64Length: audioBase64.length,
    mimeType: audioBlob.type,
    base64Preview: base64Preview,
  });

  const response = await fetch('/api/voice/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: audioBase64,
      mimeType: audioBlob.type,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'STT processing failed' }));
    console.error('STT API error response:', error);
    throw new Error(error.details || error.error || 'STT processing failed');
  }

  return response.json();
}

/**
 * Generate speech from text with emotional delivery
 * Returns audio blob URL for playback
 */
export async function textToSpeech(
  text: string,
  emotionalDelivery?: EmotionalDelivery
): Promise<string> {
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      emotional_delivery: emotionalDelivery,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'TTS processing failed' }));
    throw new Error(error.error || 'TTS processing failed');
  }

  // Create blob URL for audio playback
  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

/**
 * Stream TTS audio for immediate playback
 * Uses fetch streaming for low-latency playback
 */
export async function streamTextToSpeech(
  text: string,
  emotionalDelivery?: EmotionalDelivery,
  onChunk?: (audioData: ArrayBuffer) => void
): Promise<void> {
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      emotional_delivery: emotionalDelivery,
    }),
  });

  if (!response.ok) {
    throw new Error('TTS streaming failed');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (onChunk && value) {
      onChunk(value.buffer as ArrayBuffer);
    }
  }
}

/**
 * Play audio from a URL using Web Audio API
 */
export function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);

    audio.onended = () => {
      resolve();
    };

    audio.onerror = () => {
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch(reject);
  });
}

/**
 * Clean up a blob URL when no longer needed
 */
export function revokeAudioUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Check if the browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check if voice features are enabled
 */
export function isVoiceEnabled(): boolean {
  const enabled = import.meta.env.VITE_VOICE_ENABLED;
  return enabled === 'true' || enabled === true;
}
