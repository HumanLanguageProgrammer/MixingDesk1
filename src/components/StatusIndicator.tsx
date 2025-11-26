// src/components/StatusIndicator.tsx
// PHASE B: Added agent status

import type { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  isLoading: boolean;
  agentStatus?: 'connected' | 'connecting' | 'disconnected';
}

export function StatusIndicator({ status, isLoading, agentStatus = 'disconnected' }: StatusIndicatorProps) {
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
