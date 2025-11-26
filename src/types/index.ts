// src/types/index.ts

// ============================================
// Local UI State (Phase A - not persisted)
// ============================================

export interface Message {
  id: string;
  speaker: 'visitor' | 'agent';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ImageAsset {
  name: string;
  url: string;
}

export interface ConnectionStatus {
  database: 'connected' | 'disconnected' | 'error';
  storage: 'connected' | 'disconnected' | 'error';
}

export interface MixingDeskState {
  messages: Message[];
  currentImage: ImageAsset | null;
  currentContent: string;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
}

// ============================================
// Database Records (matches Supabase schema)
// ============================================

export interface LibraryItem {
  id: string;
  title: string;
  content: string;
  content_type: string;  // e.g., 'reference'
  complexity: 'simple' | 'intermediate' | 'advanced';
  topics: string[];
  tags: string[];
  retrieval_count: number;
  last_retrieved_at: string | null;
  created_at: string;
  updated_at: string;
}

// For Phase B - database persistence
export interface SessionRecord {
  id: string;
  session_identifier: string;
  visitor_context: Record<string, unknown> | null;
  started_at: string;
  last_active_at: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

// For Phase B - database persistence
export interface MessageRecord {
  id: string;
  session_id: string | null;
  speaker: 'visitor' | 'agent';
  content: string;
  message_type: 'text' | 'voice' | 'system';
  sequence_number: number;
  tokens_used: number | null;
  created_at: string;
}

// ============================================
// Phase B: Agent OS and LLM Integration
// ============================================

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
}

export interface AgentResponse {
  message: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolExecutionResult[];
}

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

export interface AgentState {
  isInitialized: boolean;
  isLoading: boolean;
  agentOS: AgentOS | null;
  conversationHistory: ChatMessage[];
  error: string | null;
}
