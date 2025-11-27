// src/components/VoiceButton.tsx
// Push-to-talk voice recording button

import { useCallback, useRef, useEffect } from 'react';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  isDisabled: boolean;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function VoiceButton({
  isRecording,
  isProcessing,
  isDisabled,
  duration,
  onStartRecording,
  onStopRecording,
}: VoiceButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isHoldingRef = useRef(false);

  // Handle mouse/touch down - start recording
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isDisabled || isProcessing) return;

    isHoldingRef.current = true;
    onStartRecording();
  }, [isDisabled, isProcessing, onStartRecording]);

  // Handle mouse/touch up - stop recording
  const handlePressEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    if (isRecording) {
      onStopRecording();
    }
  }, [isRecording, onStopRecording]);

  // Handle mouse leaving the button while recording
  const handleLeave = useCallback(() => {
    if (isHoldingRef.current && isRecording) {
      isHoldingRef.current = false;
      onStopRecording();
    }
  }, [isRecording, onStopRecording]);

  // Keyboard support (space bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement === buttonRef.current) {
        e.preventDefault();
        if (!isHoldingRef.current && !isDisabled && !isProcessing) {
          isHoldingRef.current = true;
          onStartRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isHoldingRef.current) {
        e.preventDefault();
        isHoldingRef.current = false;
        if (isRecording) {
          onStopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isDisabled, isProcessing, onStartRecording, onStopRecording]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handleLeave}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      disabled={isDisabled || isProcessing}
      className={`
        relative flex items-center justify-center gap-2
        px-4 py-3 rounded-lg font-medium transition-all
        select-none touch-none
        ${isRecording
          ? 'bg-red-600 text-white scale-105 shadow-lg shadow-red-500/30'
          : isProcessing
            ? 'bg-yellow-600 text-white cursor-wait'
            : isDisabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
        }
      `}
      aria-label={isRecording ? 'Recording... release to stop' : 'Hold to speak'}
    >
      {/* Microphone icon */}
      <MicrophoneIcon isRecording={isRecording} isProcessing={isProcessing} />

      {/* Button text */}
      <span className="text-sm">
        {isRecording
          ? formatDuration(duration)
          : isProcessing
            ? 'Processing...'
            : 'Hold to speak'
        }
      </span>

      {/* Recording pulse animation */}
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
}

function MicrophoneIcon({ isRecording, isProcessing }: { isRecording: boolean; isProcessing: boolean }) {
  if (isProcessing) {
    // Loading spinner
    return (
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  }

  return (
    <svg
      className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}
