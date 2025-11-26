// src/components/StatusIndicator.tsx

import type { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  isLoading: boolean;
}

export function StatusIndicator({ status, isLoading }: StatusIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Connecting...</span>
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
    </div>
  );
}

function StatusDot({ label, status }: { label: string; status: 'connected' | 'disconnected' | 'error' }) {
  const colors = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
