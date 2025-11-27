// src/hooks/useVoiceRecorder.ts

import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecorderOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

// Get the API base URL - use relative path for same-origin deployment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useVoiceRecorder({
  onTranscription,
  onError,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Determine the best supported mime type
      const mimeType = getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        onError?.('Recording error occurred');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      console.log('Recording started with mimeType:', mimeType);
    } catch (err) {
      console.error('Failed to start recording:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop());

        try {
          // Combine chunks into a single blob
          const mimeType = mediaRecorder.mimeType;
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });

          console.log('Recording stopped. Chunks:', chunksRef.current.length, 'Size:', audioBlob.size);

          if (audioBlob.size < 100) {
            throw new Error('Recording too short. Please try again.');
          }

          // Convert to base64
          const base64Audio = await blobToBase64(audioBlob);

          console.log('Sending audio to STT:', {
            originalSize: audioBlob.size,
            base64Length: base64Audio.length,
            mimeType,
          });

          // Send to STT endpoint
          const response = await fetch(`${API_BASE_URL}/api/voice/stt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio: base64Audio,
              mimeType,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `STT request failed with status ${response.status}`
            );
          }

          const result = await response.json();

          if (result.text) {
            console.log('Transcription received:', result.text);
            onTranscription?.(result.text);
          } else {
            throw new Error('No transcription received');
          }
        } catch (err) {
          console.error('STT error:', err);
          const errorMessage =
            err instanceof Error ? err.message : 'Transcription failed';
          setError(errorMessage);
          onError?.(errorMessage);
        } finally {
          setIsProcessing(false);
          chunksRef.current = [];
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  }, [isRecording, onTranscription, onError]);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
  };
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm'; // Default fallback
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
