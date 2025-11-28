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
    // Phase D: Visit lifecycle tool data
    action?: string;
    summary?: string;
    notes?: VisitNote[];
    message?: string;
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

// ============================================
// Phase C: Voice and Emotional Agency
// ============================================

// Emotion detection from Hume STT
export interface DetectedEmotion {
  emotion: string;
  score: number;  // 0-1
}

export interface EmotionAnalysis {
  primary: DetectedEmotion;
  secondary?: DetectedEmotion;
  raw: Record<string, number>;  // All detected emotions
}

export interface ProsodyAnalysis {
  pace: 'slow' | 'normal' | 'fast';
  tone: 'hesitant' | 'neutral' | 'engaged' | 'excited';
  volume: 'quiet' | 'normal' | 'loud';
}

// STT Response from Hume AI Expression Measurement API
// Provides transcription + emotion detection from voice
export interface STTResponse {
  text: string;
  confidence: number;
  duration_ms: number;
  // Hume provides 48 prosody emotions and 53 language emotions
  emotions?: EmotionAnalysis;
  prosody?: ProsodyAnalysis;
}

// Emotional delivery (agent's chosen voice expression)
export interface EmotionalDelivery {
  tone: 'excited' | 'calm' | 'empathetic' | 'confident' | 'warm' | 'professional' | 'neutral';
  intensity: number;  // 0-1
  pacing: 'energetic' | 'measured' | 'gentle' | 'normal';
}

// TTS Request
export interface TTSRequest {
  text: string;
  voice_id: string;
  emotional_delivery?: EmotionalDelivery;
}

// Voice state
export interface VoiceState {
  isEnabled: boolean;
  isRecording: boolean;
  isProcessingSTT: boolean;
  isPlayingTTS: boolean;
  currentTranscription: string;
  error: string | null;
}

// Emotional context for chat requests
export interface EmotionalContext {
  detected_emotions: EmotionAnalysis;
  prosody: ProsodyAnalysis;
}

// Extended Message with voice metadata
export interface VoiceMessage extends Message {
  inputMethod?: 'text' | 'voice';
  emotionalContext?: EmotionAnalysis;      // For visitor messages
  emotionalDelivery?: EmotionalDelivery;   // For agent messages
  hasAudio?: boolean;
  audioUrl?: string;
}

// Extended AgentResponse with emotional delivery
export interface AgentResponseWithEmotion extends AgentResponse {
  emotional_delivery?: EmotionalDelivery;
}

// ============================================
// Phase D: Visit Lifecycle and Routing
// ============================================

// Visit status enum
export type VisitStatus = 'checking_in' | 'engaged' | 'checking_out' | 'complete';

// Note source enum
export type NoteSource = 'checkin' | 'agent' | 'vws' | 'checkout';

// Individual visit note
export interface VisitNote {
  timestamp: string;
  source: NoteSource;
  content: string;
}

// Visit record from Supabase
export interface Visit {
  id: string;
  created_at: string;
  updated_at: string;
  visitor_name: string | null;
  status: VisitStatus;
  notes: VisitNote[];
}

// Create visit input
export interface CreateVisitInput {
  visitor_name?: string;
  initial_note?: string;
}

// Update visit input
export interface UpdateVisitInput {
  visitor_name?: string;
  status?: VisitStatus;
  note?: {
    source: NoteSource;
    content: string;
  };
}
