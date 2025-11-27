// src/components/StatusIndicator.tsx
// PHASE C: Added voice status

import type { ConnectionStatus } from '../types';

type VoiceStatus = 'disabled' | 'ready' | 'recording' | 'speaking';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  isLoading: boolean;
  agentStatus?: 'connected' | 'connecting' | 'disconnected';
  voiceStatus?: VoiceStatus;  // Phase C
}

export function StatusIndicator({
  status,
  isLoading,
  agentStatus = 'disconnected',
  voiceStatus = 'disabled',
}: StatusIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Initializing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <StatusDot
        label="Database"
        status={status.database}
      />
      <StatusDot
        label="Storage"
        status={status.storage}
      />
      <StatusDot
        label="Agent"
        status={agentStatus === 'connecting' ? 'disconnected' : agentStatus}
        isConnecting={agentStatus === 'connecting'}
      />
      {/* Phase C: Voice status */}
      <VoiceStatusDot status={voiceStatus} />
    </div>
  );
}

function StatusDot({
  label,
  status,
  isConnecting = false
}: {
  label: string;
  status: 'connected' | 'disconnected' | 'error';
  isConnecting?: boolean;
}) {
  const colors = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]} ${isConnecting ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

// Phase C: Voice-specific status indicator
function VoiceStatusDot({ status }: { status: VoiceStatus }) {
  const config: Record<VoiceStatus, { color: string; label: string; animate?: boolean }> = {
    disabled: {
      color: 'bg-gray-600',
      label: 'Voice',
    },
    ready: {
      color: 'bg-green-500',
      label: 'Voice',
    },
    recording: {
      color: 'bg-red-500',
      label: 'Recording',
      animate: true,
    },
    speaking: {
      color: 'bg-blue-500',
      label: 'Speaking',
      animate: true,
    },
  };

  const { color, label, animate } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color} ${animate ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
