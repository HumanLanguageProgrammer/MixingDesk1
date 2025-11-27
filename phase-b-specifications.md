# PHASE B SPECIFICATIONS: LLM Integration
## Operation Basecamp - Intelligence Layer
### For Claude Code Execution
#### November 26, 2025

---

## Mission

**Add intelligence to the Mixing Desk UI by integrating Claude API with dynamic Agent OS loading.**

This is Phase B of Operation Basecamp - proving the LLM integration pattern works with agent-controlled UI.

```yaml
What We're Building:
  - Vercel Serverless Functions (API key security)
  - Agent OS loading from Supabase (single text object)
  - Anthropic API integration with streaming
  - Tool use for UI control (display_image, display_content)
  - Agent-directed content retrieval
  - Real conversational responses (replacing placeholders)

What We're NOT Building Yet:
  - Voice capabilities (Phase C)
  - Session persistence to database (extension)
  - Multi-agent coordination
  - Production Agent OS (Crafting Wing responsibility)

Prerequisites:
  - Phase A complete (Mixing Desk UI deployed)
  - Supabase operational (database + storage)
  - Vercel project configured
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Mixing Desk React App                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │   │
│  │  │Turntable1│ │Turntable2│ │ Conversation Panel   │ │   │
│  │  │ (Image)  │ │(Content) │ │ History + Microphone │ │   │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ fetch('/api/...')
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Serverless Functions                  │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ /api/agent/init │  │ /api/agent/chat                 │  │
│  │ Load Agent OS   │  │ Conversation + Tool Execution   │  │
│  └────────┬────────┘  └────────┬────────────────────────┘  │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Anthropic API (Claude)                  │   │
│  │              + Tool Definitions                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │   agent_os   │ │library_items │ │   test-images    │    │
│  │ (text object)│ │  (content)   │ │    (storage)     │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Addition

### New Table: agent_os

```sql
-- Agent Operating System storage
-- Each agent has ONE complete OS as a text object
-- Crafted in Crafting Wing, loaded at runtime

CREATE TABLE agent_os (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL UNIQUE,
  description TEXT,
  os_content TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_agent_os_updated_at
  BEFORE UPDATE ON agent_os
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for loading
CREATE INDEX idx_agent_os_active ON agent_os(agent_name, is_active);

-- RLS Policy: Public read for anon
ALTER TABLE agent_os ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active agent_os"
  ON agent_os
  FOR SELECT
  TO public
  USING (is_active = true);
```

### Seed Data: Placeholder Agent OS

```sql
-- Placeholder Agent OS for Testing Agent
-- This will be replaced by Crafting Wing production

INSERT INTO agent_os (agent_name, description, os_content, version) VALUES (
  'testing-agent',
  'Phase B Testing Agent - validates platform capabilities',
  E'# Testing Agent Operating System v1.0

## Identity

You are the Testing Agent for Operation Basecamp - a platform validation system for the Digital Engagement System.

Your purpose is to demonstrate that all platform capabilities work correctly:
- Conversational interaction (text-based dialogue)
- Content retrieval (fetching from library)
- Visual display (showing images)
- Content display (showing text)

You are helpful, clear, and focused on validating the platform works.

## Capabilities

You have access to the following tools:

### display_image
Shows an image on Turntable 1 (the visual display area).
- Use when: Visual content would enhance the conversation
- Input: image_path (the storage path of the image)
- Effect: Image appears in Turntable 1

### display_content  
Shows text content on Turntable 2 (the content display area).
- Use when: You want to show retrieved content or detailed information
- Input: content (the text to display), title (optional heading)
- Effect: Content appears in Turntable 2

### retrieve_library_item
Fetches content from the library by title or topic.
- Use when: User asks about topics in the library
- Input: query (search term - title or topic)
- Returns: The content of matching library items

## UI Operations

You control a "Mixing Desk" interface with two display areas:

**Turntable 1 (Left/Top):** Visual display for images
- Currently available: "LLMs for Business v3.jpg" in test-images bucket
- Use display_image to show visuals

**Turntable 2 (Right/Bottom):** Content display for text
- Use display_content to show retrieved materials or explanations
- Good for detailed information that complements conversation

**Conversation Panel (Right side):** Where dialogue happens
- Your responses appear here automatically
- Keep responses conversational and clear

## Behavioral Guidelines

1. **Be helpful and clear** - You are validating the platform works
2. **Use tools to demonstrate capabilities** - Show images, display content
3. **Explain what you are doing** - Help users understand the platform
4. **Keep responses concise** - This is a testing environment

## Example Interactions

User: "Show me an image"
→ Use display_image with available test image
→ Explain what you displayed

User: "What content do you have?"
→ Use retrieve_library_item to find content
→ Use display_content to show it
→ Summarize what you found

User: "Tell me about platform validation"
→ Retrieve relevant library item
→ Display the content
→ Discuss in conversation

## Current Limitations (Phase B)

- Voice not yet available (Phase C)
- Session history not persisted (local only)
- Limited library content (test data)
- Single test image available

You are the Testing Agent. Validate the platform. Demonstrate capabilities. Be helpful.',
  '1.0.0'
);
```

---

## Project Structure Updates

```
mixing-desk/
├── api/                          # NEW: Vercel Serverless Functions
│   └── agent/
│       ├── init.ts               # Load Agent OS
│       └── chat.ts               # Conversation endpoint
├── src/
│   ├── components/
│   │   ├── MixingDesk.tsx        # UPDATED: LLM integration
│   │   ├── Turntable1.tsx        # UPDATED: Agent-controlled
│   │   ├── Turntable2.tsx        # UPDATED: Agent-controlled
│   │   ├── Microphone.tsx        # Unchanged
│   │   ├── MessageHistory.tsx    # UPDATED: Streaming support
│   │   └── StatusIndicator.tsx   # UPDATED: Agent status
│   ├── lib/
│   │   ├── supabase.ts           # Unchanged
│   │   └── agent.ts              # NEW: Agent API client
│   ├── types/
│   │   └── index.ts              # UPDATED: New types
│   ├── hooks/
│   │   └── useAgent.ts           # NEW: Agent state management
│   └── ...
├── .env.local                    # UPDATED: Add Anthropic key
└── ...
```

---

## Environment Variables

```bash
# .env.local (add to existing)

# Supabase (existing)
VITE_SUPABASE_URL=https://evtrcspwpxnygvjfpbng.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Anthropic (NEW - server-side only, no VITE_ prefix)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Agent Configuration (NEW)
VITE_AGENT_NAME=testing-agent
```

**Important:** `ANTHROPIC_API_KEY` has no `VITE_` prefix - it's only available server-side in Vercel Functions, never exposed to browser.

---

## TypeScript Types (Updated)

```typescript
// src/types/index.ts

// Existing types from Phase A...

// NEW: Agent OS
export interface AgentOS {
  id: string;
  agent_name: string;
  description: string | null;
  os_content: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// NEW: Chat message for API
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// NEW: Tool call from Claude
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// NEW: Tool result
export interface ToolResult {
  tool_use_id: string;
  content: string;
}

// NEW: Agent response (from our API)
export interface AgentResponse {
  message: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolExecutionResult[];
}

// NEW: Tool execution result (what we send to UI)
export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  data?: {
    image_url?: string;
    content?: string;
    title?: string;
    library_items?: LibraryItem[];
  };
  error?: string;
}

// NEW: Agent state
export interface AgentState {
  isInitialized: boolean;
  isLoading: boolean;
  agentOS: AgentOS | null;
  conversationHistory: ChatMessage[];
  error: string | null;
}

// Updated: Message with streaming support
export interface Message {
  id: string;
  speaker: 'visitor' | 'agent';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}
```

---

## API Route: /api/agent/init.ts

```typescript
// api/agent/init.ts
// Vercel Serverless Function - Loads Agent OS from Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export const config = {
  runtime: 'edge', // Use edge runtime for speed
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { agent_name } = await request.json();
    
    if (!agent_name) {
      return new Response(
        JSON.stringify({ error: 'agent_name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Agent OS from Supabase
    const { data: agentOS, error } = await supabase
      .from('agent_os')
      .select('*')
      .eq('agent_name', agent_name)
      .eq('is_active', true)
      .single();

    if (error || !agentOS) {
      console.error('Error loading Agent OS:', error);
      return new Response(
        JSON.stringify({ error: 'Agent OS not found', details: error?.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the Agent OS
    return new Response(JSON.stringify({ agentOS }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Init error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## API Route: /api/agent/chat.ts

```typescript
// api/agent/chat.ts
// Vercel Serverless Function - Handles conversation with Claude

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export const config = {
  runtime: 'edge',
  maxDuration: 30, // Allow longer for LLM responses
};

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'display_image',
    description: 'Display an image on Turntable 1 (the visual display area). Use this to show images to the visitor.',
    input_schema: {
      type: 'object' as const,
      properties: {
        image_path: {
          type: 'string',
          description: 'The filename or path of the image in the test-images storage bucket',
        },
      },
      required: ['image_path'],
    },
  },
  {
    name: 'display_content',
    description: 'Display text content on Turntable 2 (the content display area). Use this to show detailed information, retrieved content, or explanations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The text content to display',
        },
        title: {
          type: 'string',
          description: 'Optional title for the content',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'retrieve_library_item',
    description: 'Search and retrieve content from the library. Use this to find relevant information to share with the visitor.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query - can be a title, topic, or keyword',
        },
      },
      required: ['query'],
    },
  },
];

// Tool execution functions
async function executeDisplayImage(input: { image_path: string }) {
  const { data } = supabase.storage
    .from('test-images')
    .getPublicUrl(input.image_path);
  
  return {
    success: true,
    image_url: data.publicUrl,
  };
}

async function executeDisplayContent(input: { content: string; title?: string }) {
  return {
    success: true,
    content: input.content,
    title: input.title,
  };
}

async function executeRetrieveLibraryItem(input: { query: string }) {
  // Search by title or topics
  const { data: items, error } = await supabase
    .from('library_items')
    .select('*')
    .or(`title.ilike.%${input.query}%,topics.cs.{${input.query}}`);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    library_items: items || [],
  };
}

// Execute a tool call
async function executeTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'display_image':
      return executeDisplayImage(input as { image_path: string });
    case 'display_content':
      return executeDisplayContent(input as { content: string; title?: string });
    case 'retrieve_library_item':
      return executeRetrieveLibraryItem(input as { query: string });
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, systemPrompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: 'systemPrompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Claude API
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools,
      messages: messages,
    });

    // Collect tool results to send back to UI
    const toolExecutionResults: Array<{
      tool: string;
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
    }> = [];

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
        
        // Track for UI
        toolExecutionResults.push({
          tool: toolUse.name,
          success: result.success,
          data: result.success ? result : undefined,
          error: result.success ? undefined : (result as { error: string }).error,
        });

        // Format for Claude
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue conversation with tool results
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        tools: tools,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return new Response(
      JSON.stringify({
        message: textContent?.text || '',
        tool_results: toolExecutionResults,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## Agent Client Library

```typescript
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
```

---

## useAgent Hook

```typescript
// src/hooks/useAgent.ts
// React hook for agent state management

import { useState, useCallback, useEffect } from 'react';
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
```

---

## Updated MixingDesk Component

```typescript
// src/components/MixingDesk.tsx
// UPDATED: Integrated with agent

import { useState, useEffect, useCallback } from 'react';
import { Turntable1 } from './Turntable1';
import { Turntable2 } from './Turntable2';
import { Microphone } from './Microphone';
import { MessageHistory } from './MessageHistory';
import { StatusIndicator } from './StatusIndicator';
import { useAgent } from '../hooks/useAgent';
import { 
  testConnection, 
  fetchLibraryItems, 
  getStorageUrl,
  listStorageFiles 
} from '../lib/supabase';
import type { Message, ConnectionStatus, LibraryItem, ImageAsset, ToolExecutionResult } from '../types';

export function MixingDesk() {
  // Agent state
  const { 
    isInitialized: agentInitialized, 
    isLoading: agentLoading, 
    error: agentError,
    agentOS,
    initialize: initializeAgent,
    chat,
    clearError 
  } = useAgent();

  // UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageAsset | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [currentContentTitle, setCurrentContentTitle] = useState<string>('');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    database: 'disconnected',
    storage: 'disconnected',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    initializeDesk();
  }, []);

  async function initializeDesk() {
    setIsLoading(true);
    
    try {
      // Test database connection
      const dbConnected = await testConnection();
      setConnectionStatus(prev => ({
        ...prev,
        database: dbConnected ? 'connected' : 'error',
      }));

      if (dbConnected) {
        // Fetch library items
        const items = await fetchLibraryItems();
        setLibraryItems(items || []);
        
        // Set initial content from first library item
        if (items && items.length > 0) {
          setCurrentContent(items[0].content);
          setCurrentContentTitle(items[0].title);
        }
      }

      // Test storage
      try {
        const files = await listStorageFiles('test-images');
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'connected',
        }));

        // Load first image if available
        if (files && files.length > 0) {
          const imageFile = files.find(f => 
            f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          );
          if (imageFile) {
            const url = getStorageUrl('test-images', imageFile.name);
            setCurrentImage({ name: imageFile.name, url });
          }
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'error',
        }));
      }

      // Initialize agent
      await initializeAgent();

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Process tool results from agent
  const processToolResults = useCallback((results: ToolExecutionResult[]) => {
    for (const result of results) {
      if (!result.success) continue;

      switch (result.tool) {
        case 'display_image':
          if (result.data?.image_url) {
            setCurrentImage({
              name: 'Agent displayed image',
              url: result.data.image_url as string,
            });
          }
          break;

        case 'display_content':
          if (result.data?.content) {
            setCurrentContent(result.data.content as string);
            setCurrentContentTitle((result.data.title as string) || '');
          }
          break;

        case 'retrieve_library_item':
          // Content will be displayed via display_content tool
          // This just fetches the data
          break;
      }
    }
  }, []);

  // Handle visitor message submission
  async function handleSendMessage(content: string) {
    if (!content.trim()) return;

    // Add visitor message
    const visitorMessage: Message = {
      id: crypto.randomUUID(),
      speaker: 'visitor',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, visitorMessage]);

    // Check if agent is ready
    if (!agentInitialized || !agentOS) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        speaker: 'agent',
        content: 'I\'m still initializing. Please wait a moment and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add placeholder for streaming
    const agentMessageId = crypto.randomUUID();
    const agentMessage: Message = {
      id: agentMessageId,
      speaker: 'agent',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, agentMessage]);

    try {
      // Get agent response
      const { response, toolResults } = await chat(content.trim(), messages);

      // Process any tool results (updates Turntables)
      processToolResults(toolResults);

      // Update agent message with response
      setMessages(prev => 
        prev.map(m => 
          m.id === agentMessageId 
            ? { ...m, content: response, isStreaming: false }
            : m
        )
      );

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => 
        prev.map(m => 
          m.id === agentMessageId 
            ? { 
                ...m, 
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false 
              }
            : m
        )
      );
    }
  }

  // Handle library item selection (manual testing)
  function handleSelectLibraryItem(item: LibraryItem) {
    setCurrentContent(item.content);
    setCurrentContentTitle(item.title);
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-100">
            Mixing Desk
            <span className="ml-2 text-sm font-normal text-gray-400">
              Operation Basecamp
            </span>
            {agentOS && (
              <span className="ml-2 text-xs font-normal text-green-400">
                ({agentOS.agent_name} v{agentOS.version})
              </span>
            )}
          </h1>
          <StatusIndicator 
            status={connectionStatus} 
            isLoading={isLoading}
            agentStatus={agentInitialized ? 'connected' : agentLoading ? 'connecting' : 'disconnected'}
          />
        </div>
        {agentError && (
          <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
            <span>Agent error: {agentError}</span>
            <button 
              onClick={clearError}
              className="text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Turntables */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-auto">
          {/* Turntable 1: Image Display */}
          <div className="flex-1 min-h-[300px]">
            <Turntable1 
              image={currentImage} 
              isLoading={isLoading} 
            />
          </div>

          {/* Turntable 2: Content Display */}
          <div className="flex-1 min-h-[300px]">
            <Turntable2 
              content={currentContent}
              title={currentContentTitle}
              libraryItems={libraryItems}
              onSelectItem={handleSelectLibraryItem}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Column: Conversation */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-700">
          {/* Message History */}
          <div className="flex-1 overflow-hidden">
            <MessageHistory messages={messages} />
          </div>

          {/* Microphone (Input) */}
          <div className="border-t border-gray-700">
            <Microphone 
              onSend={handleSendMessage} 
              disabled={agentLoading || !agentInitialized}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## Updated StatusIndicator

```typescript
// src/components/StatusIndicator.tsx
// UPDATED: Include agent status

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
      <StatusDot 
        label="Agent" 
        status={agentStatus === 'connected' ? 'connected' : agentStatus === 'connecting' ? 'disconnected' : 'error'} 
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
```

---

## Updated Turntable2 (with title support)

```typescript
// src/components/Turntable2.tsx
// UPDATED: Support for title from agent

import type { LibraryItem } from '../types';

interface Turntable2Props {
  content: string;
  title?: string;
  libraryItems: LibraryItem[];
  onSelectItem: (item: LibraryItem) => void;
  isLoading: boolean;
}

export function Turntable2({ content, title, libraryItems, onSelectItem, isLoading }: Turntable2Props) {
  return (
    <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300">
          Turntable 2
          <span className="ml-2 text-gray-500 font-normal">Content Display</span>
        </h2>
        {title && (
          <p className="text-xs text-blue-400 mt-1">{title}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">Loading content...</p>
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">No content loaded</p>
          </div>
        )}
      </div>

      {/* Library Item Selector (for testing) */}
      {libraryItems.length > 0 && (
        <div className="border-t border-gray-700 p-3">
          <p className="text-xs text-gray-500 mb-2">Library Items (test selector):</p>
          <div className="flex flex-wrap gap-2">
            {libraryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Updated Microphone (with disabled state)

```typescript
// src/components/Microphone.tsx
// UPDATED: Support disabled state

import { useState, useRef, useEffect } from 'react';

interface MicrophoneProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function Microphone({ onSend, disabled = false }: MicrophoneProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Agent initializing..." : "Type a message..."}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {disabled ? 'Waiting for agent...' : 'Press Enter to send, Shift+Enter for new line'}
      </p>
    </form>
  );
}
```

---

## Updated MessageHistory (streaming support)

```typescript
// src/components/MessageHistory.tsx
// UPDATED: Streaming indicator

import { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface MessageHistoryProps {
  messages: Message[];
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gray-850">
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-sm font-medium text-gray-300">Conversation</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation below</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isVisitor = message.speaker === 'visitor';
  
  return (
    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isVisitor
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        {message.isStreaming && !message.content ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className={`text-xs mt-1 ${isVisitor ? 'text-blue-200' : 'text-gray-400'}`}>
              {formatTime(message.timestamp)}
              {message.isStreaming && ' • typing...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
```

---

## Package.json Updates

```json
{
  "name": "mixing-desk",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vercel/node": "^3.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

## Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"
    }
  }
}
```

---

## Deployment Procedure

### Step 1: Database Setup

Run in Supabase SQL Editor:
```sql
-- Create agent_os table
CREATE TABLE agent_os (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL UNIQUE,
  description TEXT,
  os_content TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_os ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active agent_os"
  ON agent_os FOR SELECT TO public
  USING (is_active = true);

-- Insert placeholder Agent OS (copy from seed data above)
INSERT INTO agent_os (agent_name, description, os_content, version) VALUES (...);
```

### Step 2: Environment Variables

Add to Vercel project settings:
- `ANTHROPIC_API_KEY` = your Anthropic API key (server-side only)
- `VITE_AGENT_NAME` = `testing-agent`

### Step 3: Deploy

Push updated code to GitHub. Vercel will auto-deploy.

### Step 4: Verify

- [ ] Agent status shows "connected" (green dot)
- [ ] Send a message, get a real LLM response
- [ ] Ask agent to show an image → Turntable 1 updates
- [ ] Ask agent about library content → Turntable 2 updates
- [ ] Conversation flows naturally

---

## Success Criteria

**Phase B is complete when:**

```yaml
Technical:
  ✓ Agent OS loads from Supabase
  ✓ Anthropic API integration working
  ✓ Tool use operational (display_image, display_content, retrieve_library_item)
  ✓ Agent controls Turntables via tool calls
  ✓ Real conversational responses (not placeholders)
  ✓ No API keys exposed in browser

Platform Capabilities Validated:
  ✓ Read: Agent retrieves content from library
  ✓ Remember: Conversation history maintained
  ✓ Retrieve: Agent fetches images from storage
  ✓ Converse: Real LLM dialogue working
  ✓ Show: Agent-directed visual display

Architecture Validated:
  ✓ Dynamic Agent OS (single text object from Supabase)
  ✓ Vercel Functions for API key security
  ✓ Tool use pattern for UI control
  ✓ Ready for Phase C (voice)
```

---

## Notes for Phase C

When ready for voice integration:

1. **Hume AI Integration**
   - Text-to-Speech (agent speaks responses)
   - Speech-to-Text (visitor speaks input)
   - Voice controls in UI

2. **Agent OS Update**
   - Add voice capability documentation
   - Update UI operations section
   - Crafting Wing produces new version

3. **React Updates**
   - Voice recording in Microphone component
   - Audio playback for agent responses
   - Voice/text mode toggle

---

## Notes for Crafting Wing

**When Crafting Wing activates:**

The placeholder Agent OS in this spec is functional but basic. Crafting Wing will:

1. **Cultivate proper agent identity** - Beyond "Testing Agent"
2. **Develop comprehensive UI operations** - Detailed guidance
3. **Create quality behavioral guidelines** - Consistent personality
4. **Iterate through Claude collaboration** - Not code generation

The infrastructure (table, loading, API) remains unchanged. Only the `os_content` text evolves through Crafting Wing work.

---

## Metadata

```yaml
Document: phase-b-specifications.md
Type: Technical Specification for Claude Code
Version: 1.0
Created: November 26, 2025

Purpose:
  Complete specifications for Phase B implementation
  LLM integration with dynamic Agent OS
  Tool use for UI control
  Vercel Functions for security

Target:
  Working LLM integration
  Agent-controlled Mixing Desk
  Dynamic OS loading from Supabase
  Ready for Phase C voice

For:
  Claude Code (implementation)
  Michael (deployment + verification)
  Digital Operations Workspace

Architecture Principles:
  - Single text object Agent OS (not runtime assembly)
  - Crafting Wing produces OS content
  - Simple loading, simple updates
  - Tool use for UI control
  - F1 Team model (driver = designer = builder)
```

---

**END OF PHASE B SPECIFICATIONS**

*Intelligence layer added*
*Agent OS from Supabase*
*Tool use for UI control*
*Ready for Claude Code execution* 🎯
