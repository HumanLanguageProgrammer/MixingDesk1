// src/hooks/useVoice.ts
// Voice state management hook combining STT, TTS, and audio recording

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import {
  speechToText,
  textToSpeech,
  playAudioUrl,
  revokeAudioUrl,
  isVoiceEnabled,
  isAudioRecordingSupported,
} from '../lib/voice';
import type { STTResponse, EmotionalDelivery, EmotionAnalysis, ProsodyAnalysis } from '../types';

export interface UseVoiceReturn {
  // Feature status
  isEnabled: boolean;
  isSupported: boolean;

  // Recording state
  isRecording: boolean;
  recordingDuration: number;

  // Processing state
  isProcessingSTT: boolean;
  isPlayingTTS: boolean;

  // Results
  lastTranscription: string;
  lastEmotions: EmotionAnalysis | null;
  lastProsody: ProsodyAnalysis | null;

  // Errors
  error: string | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecordingAndTranscribe: () => Promise<STTResponse | null>;
  speakText: (text: string, emotionalDelivery?: EmotionalDelivery) => Promise<void>;
  stopSpeaking: () => void;
  clearError: () => void;
  toggleVoice: () => void;
}

export function useVoice(): UseVoiceReturn {
  // Feature flags
  const [isEnabled, setIsEnabled] = useState(() => isVoiceEnabled());
  const isSupported = isAudioRecordingSupported();

  // Processing states
  const [isProcessingSTT, setIsProcessingSTT] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  // Results
  const [lastTranscription, setLastTranscription] = useState('');
  const [lastEmotions, setLastEmotions] = useState<EmotionAnalysis | null>(null);
  const [lastProsody, setLastProsody] = useState<ProsodyAnalysis | null>(null);

  // Errors
  const [error, setError] = useState<string | null>(null);

  // Audio playback tracking
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  // Use the audio recorder hook
  const {
    isRecording,
    duration: recordingDuration,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    error: recorderError,
    clearRecording,
  } = useAudioRecorder();

  // Sync recorder errors
  useEffect(() => {
    if (recorderError) {
      setError(recorderError);
    }
  }, [recorderError]);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (!isEnabled || !isSupported) {
      setError('Voice features are not available');
      return;
    }

    setError(null);
    setLastTranscription('');
    setLastEmotions(null);
    setLastProsody(null);

    await startAudioRecording();
  }, [isEnabled, isSupported, startAudioRecording]);

  /**
   * Stop recording and send to STT
   */
  const stopRecordingAndTranscribe = useCallback(async (): Promise<STTResponse | null> => {
    if (!isRecording) {
      return null;
    }

    try {
      setIsProcessingSTT(true);
      setError(null);

      // Stop recording and get audio blob
      const audioBlob = await stopAudioRecording();

      if (!audioBlob || audioBlob.size === 0) {
        setError('No audio recorded');
        return null;
      }

      // Send to STT API
      const sttResult = await speechToText(audioBlob);

      // Store results
      setLastTranscription(sttResult.text);
      // Emotions and prosody are optional (not provided by Whisper)
      setLastEmotions(sttResult.emotions || null);
      setLastProsody(sttResult.prosody || null);

      return sttResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
      setError(errorMessage);
      console.error('STT error:', err);
      return null;

    } finally {
      setIsProcessingSTT(false);
      clearRecording();
    }
  }, [isRecording, stopAudioRecording, clearRecording]);

  /**
   * Speak text with TTS
   */
  const speakText = useCallback(async (
    text: string,
    emotionalDelivery?: EmotionalDelivery
  ) => {
    if (!isEnabled) {
      console.log('Voice not enabled, skipping TTS');
      return;
    }

    if (!text.trim()) {
      return;
    }

    try {
      setIsPlayingTTS(true);
      setError(null);

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Revoke previous URL
      if (currentAudioUrlRef.current) {
        revokeAudioUrl(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }

      // Get TTS audio
      const audioUrl = await textToSpeech(text, emotionalDelivery);
      currentAudioUrlRef.current = audioUrl;

      // Play audio
      await playAudioUrl(audioUrl);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Speech synthesis failed';
      // Don't show error for TTS failures - just log them
      // The text is still displayed in the chat
      console.error('TTS error:', errorMessage);

    } finally {
      setIsPlayingTTS(false);

      // Cleanup
      if (currentAudioUrlRef.current) {
        revokeAudioUrl(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
    }
  }, [isEnabled]);

  /**
   * Stop currently playing audio
   */
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (currentAudioUrlRef.current) {
      revokeAudioUrl(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    setIsPlayingTTS(false);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Toggle voice features on/off
   */
  const toggleVoice = useCallback(() => {
    setIsEnabled(prev => !prev);

    // Stop any active recording or playback
    if (isRecording) {
      clearRecording();
    }
    if (isPlayingTTS) {
      stopSpeaking();
    }
  }, [isRecording, isPlayingTTS, clearRecording, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (currentAudioUrlRef.current) {
        revokeAudioUrl(currentAudioUrlRef.current);
      }
    };
  }, []);

  return {
    isEnabled,
    isSupported,
    isRecording,
    recordingDuration,
    isProcessingSTT,
    isPlayingTTS,
    lastTranscription,
    lastEmotions,
    lastProsody,
    error,
    startRecording,
    stopRecordingAndTranscribe,
    speakText,
    stopSpeaking,
    clearError,
    toggleVoice,
  };
}
