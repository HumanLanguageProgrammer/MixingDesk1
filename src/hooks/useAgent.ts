// src/hooks/useAgent.ts
// React hook for agent state management
// Phase C: Updated with emotional context support
// Phase D: Updated with visit lifecycle support

import { useState, useCallback } from 'react';
import { initializeAgent, sendMessage, toClaudeMessages } from '../lib/agent';
import type { AgentOS, Message, ToolExecutionResult, EmotionalDelivery, EmotionalContext, VisitNote } from '../types';

export interface ChatResult {
  response: string;
  toolResults: ToolExecutionResult[];
  emotionalDelivery?: EmotionalDelivery;  // Phase C
}

// Phase D: Props for useAgent hook
export interface UseAgentProps {
  visitId?: string;
  visitNotes?: VisitNote[];
  onNavigate?: (destination: string) => void;
  onAddNote?: (content: string) => void;
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

export function useAgent(props: UseAgentProps = {}): UseAgentReturn {
  const { visitId, visitNotes, onNavigate, onAddNote } = props;
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

      // Phase D: Build visit context if available
      const visitContext = visitId && visitNotes ? { visitId, visitNotes } : undefined;

      // Send to agent (with or without emotional context and visit context)
      const { message, tool_results, emotional_delivery } = await sendMessage(
        claudeMessages,
        agentOS.os_content,
        emotionalContext,
        visitContext
      );

      // Phase D: Process visit-related tool results
      if (tool_results) {
        for (const result of tool_results) {
          if (result.success && result.data) {
            // Handle add_visit_note action
            if (result.data.action === 'add_visit_note' && result.data.content && onAddNote) {
              onAddNote(result.data.content as string);
            }
            // Handle end_session action
            if (result.data.action === 'end_session' && onNavigate) {
              // Add summary note if provided
              if (result.data.summary && onAddNote) {
                onAddNote(`Session summary: ${result.data.summary}`);
              }
              // Navigate to checkout
              onNavigate('checkout');
            }
          }
        }
      }

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
  }, [agentOS, visitId, visitNotes, onNavigate, onAddNote]);

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
