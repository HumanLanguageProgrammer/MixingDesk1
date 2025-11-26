// src/types/index.ts

// ============================================
// Local UI State (Phase A - not persisted)
// ============================================

export interface Message {
  id: string;
  speaker: 'visitor' | 'agent';
  content: string;
  timestamp: Date;
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
