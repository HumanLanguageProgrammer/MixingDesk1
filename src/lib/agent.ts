// src/lib/agent.ts
// Client-side functions for interacting with agent API

import type { AgentOS, ChatMessage, ToolExecutionResult } from '../types';

const AGENT_NAME = import.meta.env.VITE_AGENT_NAME || 'testing-agent';

export interface InitResponse {
  agentOS: AgentOS;
}

export interface ChatResponse {
  message: string;
  tool_results?: ToolExecutionResult[];
}

/**
 * Initialize the agent by loading its OS from Supabase
 */
export async function initializeAgent(): Promise<InitResponse> {
  const response = await fetch('/api/agent/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_name: AGENT_NAME }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to initialize agent');
  }

  return response.json();
}

/**
 * Send a message to the agent and get a response
 */
export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ChatResponse> {
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Convert our Message format to Claude's ChatMessage format
 */
export function toClaudeMessages(messages: Array<{ speaker: string; content: string }>): ChatMessage[] {
  return messages.map(m => ({
    role: m.speaker === 'visitor' ? 'user' : 'assistant',
    content: m.content,
  }));
}
