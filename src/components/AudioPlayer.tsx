// src/components/AudioPlayer.tsx
// Audio playback indicator and controls

interface AudioPlayerProps {
  isPlaying: boolean;
  onStop?: () => void;
}

export function AudioPlayer({ isPlaying, onStop }: AudioPlayerProps) {
  if (!isPlaying) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 rounded-lg border border-blue-700/50">
      {/* Animated speaker icon */}
      <div className="relative">
        <SpeakerIcon />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex space-x-0.5">
            <span className="w-0.5 h-2 bg-blue-400 rounded animate-sound-wave-1"></span>
            <span className="w-0.5 h-3 bg-blue-400 rounded animate-sound-wave-2"></span>
            <span className="w-0.5 h-2 bg-blue-400 rounded animate-sound-wave-3"></span>
          </span>
        </div>
      </div>

      <span className="text-sm text-blue-300">Agent speaking...</span>

      {onStop && (
        <button
          type="button"
          onClick={onStop}
          className="ml-2 p-1 hover:bg-blue-800/50 rounded transition-colors"
          aria-label="Stop speaking"
        >
          <StopIcon />
        </button>
      )}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg
      className="h-5 w-5 text-blue-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a.75.75 0 01-.75-.75V6a.75.75 0 011.5 0v12a.75.75 0 01-.75.75zM7.5 15.75L4.72 13.5H2.25a.75.75 0 01-.75-.75v-1.5a.75.75 0 01.75-.75h2.47L7.5 8.25v7.5z"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      className="h-4 w-4 text-blue-300 hover:text-white"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

// Add CSS for the sound wave animation via a style tag
// This will be injected when the component is used
export function AudioPlayerStyles() {
  return (
    <style>{`
      @keyframes sound-wave-1 {
        0%, 100% { height: 0.5rem; }
        50% { height: 1rem; }
      }
      @keyframes sound-wave-2 {
        0%, 100% { height: 0.75rem; }
        50% { height: 0.5rem; }
      }
      @keyframes sound-wave-3 {
        0%, 100% { height: 0.5rem; }
        50% { height: 1rem; }
      }
      .animate-sound-wave-1 {
        animation: sound-wave-1 0.8s ease-in-out infinite;
      }
      .animate-sound-wave-2 {
        animation: sound-wave-2 0.8s ease-in-out infinite 0.1s;
      }
      .animate-sound-wave-3 {
        animation: sound-wave-3 0.8s ease-in-out infinite 0.2s;
      }
    `}</style>
  );
}
