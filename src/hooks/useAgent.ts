// src/hooks/useAgent.ts
// React hook for agent state management

import { useState, useCallback } from 'react';
import { initializeAgent, sendMessage, toClaudeMessages } from '../lib/agent';
import type { AgentOS, Message, ToolExecutionResult } from '../types';

export interface UseAgentReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  agentOS: AgentOS | null;

  // Actions
  initialize: () => Promise<void>;
  chat: (userMessage: string, messageHistory: Message[]) => Promise<{
    response: string;
    toolResults: ToolExecutionResult[];
  }>;
  clearError: () => void;
}

export function useAgent(): UseAgentReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentOS, setAgentOS] = useState<AgentOS | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { agentOS } = await initializeAgent();
      setAgentOS(agentOS);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize agent');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const chat = useCallback(async (
    userMessage: string,
    messageHistory: Message[]
  ): Promise<{ response: string; toolResults: ToolExecutionResult[] }> => {
    if (!agentOS) {
      throw new Error('Agent not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert message history to Claude format
      const claudeMessages = toClaudeMessages(
        messageHistory.map(m => ({ speaker: m.speaker, content: m.content }))
      );

      // Add current user message
      claudeMessages.push({ role: 'user', content: userMessage });

      // Send to agent
      const { message, tool_results } = await sendMessage(
        claudeMessages,
        agentOS.os_content
      );

      return {
        response: message,
        toolResults: tool_results || [],
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [agentOS]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    agentOS,
    initialize,
    chat,
    clearError,
  };
}
