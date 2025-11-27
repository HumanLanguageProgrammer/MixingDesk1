// src/lib/voice.ts
// Client-side functions for voice API (STT + TTS)

import type { STTResponse, EmotionalDelivery } from '../types';

/**
 * Send audio for speech-to-text processing with emotion detection
 */
export async function speechToText(audioBlob: Blob): Promise<STTResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch('/api/voice/stt', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'STT processing failed' }));
    throw new Error(error.error || 'STT processing failed');
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
