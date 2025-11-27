// src/hooks/useAgent.ts
// React hook for agent state management
// Phase C: Updated with emotional context support

import { useState, useCallback } from 'react';
import { initializeAgent, sendMessage, toClaudeMessages } from '../lib/agent';
import type { AgentOS, Message, ToolExecutionResult, EmotionalDelivery, EmotionalContext } from '../types';

export interface ChatResult {
  response: string;
  toolResults: ToolExecutionResult[];
  emotionalDelivery?: EmotionalDelivery;  // Phase C
}

export interface UseAgentReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  agentOS: AgentOS | null;

  // Actions
  initialize: () => Promise<void>;
  chat: (userMessage: string, messageHistory: Message[]) => Promise<ChatResult>;
  chatWithEmotion: (
    userMessage: string,
    messageHistory: Message[],
    emotionalContext: EmotionalContext
  ) => Promise<ChatResult>;  // Phase C
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

  // Core chat function with optional emotional context
  const performChat = useCallback(async (
    userMessage: string,
    messageHistory: Message[],
    emotionalContext?: EmotionalContext
  ): Promise<ChatResult> => {
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

      // Send to agent (with or without emotional context)
      const { message, tool_results, emotional_delivery } = await sendMessage(
        claudeMessages,
        agentOS.os_content,
        emotionalContext
      );

      return {
        response: message,
        toolResults: tool_results || [],
        emotionalDelivery: emotional_delivery,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [agentOS]);

  // Standard chat (no emotional context)
  const chat = useCallback(async (
    userMessage: string,
    messageHistory: Message[]
  ): Promise<ChatResult> => {
    return performChat(userMessage, messageHistory);
  }, [performChat]);

  // Chat with emotional context (Phase C)
  const chatWithEmotion = useCallback(async (
    userMessage: string,
    messageHistory: Message[],
    emotionalContext: EmotionalContext
  ): Promise<ChatResult> => {
    return performChat(userMessage, messageHistory, emotionalContext);
  }, [performChat]);

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
    chatWithEmotion,
    clearError,
  };
}
