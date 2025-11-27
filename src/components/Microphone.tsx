// src/components/Microphone.tsx

import { useState, useRef, useEffect } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface MicrophoneProps {
  onSend: (message: string) => void;
}

export function Microphone({ onSend }: MicrophoneProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder({
    onTranscription: (text) => {
      // Append transcribed text to input
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
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

  async function handleVoiceToggle() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
      {/* Voice error message */}
      {voiceError && (
        <div className="mb-2 px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {voiceError}
        </div>
      )}

      <div className="flex gap-3">
        {/* Voice recording button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          disabled={isProcessing}
          className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center ${
            isRecording
              ? 'bg-red-600 hover:bg-red-500 animate-pulse'
              : isProcessing
              ? 'bg-gray-600 cursor-wait'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : 'Start voice recording'}
        >
          {isProcessing ? (
            // Spinner icon
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            // Microphone icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Recording... click mic to stop' : 'Type a message or use voice...'}
            rows={1}
            disabled={isRecording}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400 disabled:opacity-50"
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || isRecording || isProcessing}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {isRecording
          ? 'Recording... Click the microphone to stop and transcribe'
          : 'Press Enter to send, Shift+Enter for new line, or use the microphone for voice input'}
      </p>
    </form>
  );
}
