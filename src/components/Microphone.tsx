// src/components/Microphone.tsx
// Phase C: Updated with voice input support

import { useState, useRef, useEffect } from 'react';
import { VoiceButton } from './VoiceButton';
import { AudioPlayer, AudioPlayerStyles } from './AudioPlayer';
import type { STTResponse, EmotionAnalysis, ProsodyAnalysis } from '../types';

interface MicrophoneProps {
  onSend: (message: string) => void;
  onSendWithEmotion?: (
    message: string,
    emotions: EmotionAnalysis,
    prosody: ProsodyAnalysis
  ) => void;
  disabled?: boolean;
  // Voice state (passed from parent)
  voiceEnabled?: boolean;
  isRecording?: boolean;
  recordingDuration?: number;
  isProcessingSTT?: boolean;
  isPlayingTTS?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => Promise<STTResponse | null>;
  onStopSpeaking?: () => void;
}

export function Microphone({
  onSend,
  onSendWithEmotion,
  disabled = false,
  voiceEnabled = false,
  isRecording = false,
  recordingDuration = 0,
  isProcessingSTT = false,
  isPlayingTTS = false,
  onStartRecording,
  onStopRecording,
  onStopSpeaking,
}: MicrophoneProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  // Handle voice recording completion
  async function handleVoiceStop() {
    if (!onStopRecording) return;

    const result = await onStopRecording();

    if (result && result.text.trim()) {
      // Use emotion-aware send if available
      if (onSendWithEmotion && result.emotions && result.prosody) {
        onSendWithEmotion(result.text, result.emotions, result.prosody);
      } else {
        onSend(result.text);
      }
    }
  }

  const isVoiceActive = isRecording || isProcessingSTT;
  const showVoiceButton = voiceEnabled && onStartRecording && onStopRecording;

  return (
    <div className="p-4 bg-gray-800">
      {/* Audio player styles */}
      <AudioPlayerStyles />

      {/* TTS playback indicator */}
      {isPlayingTTS && (
        <div className="mb-3">
          <AudioPlayer isPlaying={isPlayingTTS} onStop={onStopSpeaking} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? 'Recording...'
                  : isProcessingSTT
                    ? 'Transcribing...'
                    : disabled
                      ? 'Waiting for agent...'
                      : voiceEnabled
                        ? 'Type or hold to speak...'
                        : 'Type a message...'
              }
              rows={1}
              disabled={disabled || isVoiceActive}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Voice button (Phase C) */}
          {showVoiceButton && (
            <VoiceButton
              isRecording={isRecording}
              isProcessing={isProcessingSTT}
              isDisabled={disabled || isPlayingTTS}
              duration={recordingDuration}
              onStartRecording={onStartRecording}
              onStopRecording={handleVoiceStop}
            />
          )}

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || disabled || isVoiceActive}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Help text */}
        <p className="mt-2 text-xs text-gray-500">
          {isRecording
            ? 'Release to send voice message'
            : isProcessingSTT
              ? 'Processing your voice...'
              : disabled
                ? 'Agent initializing...'
                : voiceEnabled
                  ? 'Press Enter to send text, or hold the mic button to speak'
                  : 'Press Enter to send, Shift+Enter for new line'
          }
        </p>
      </form>
    </div>
  );
}
