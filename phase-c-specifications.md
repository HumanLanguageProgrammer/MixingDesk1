# PHASE C SPECIFICATIONS: Voice Integration
## Operation Basecamp - Voice Layer
### For Claude Code Execution
#### November 27, 2025

---

## Mission

**Add voice capabilities to the Mixing Desk UI with emotional intelligence via Hume AI.**

This is Phase C of Operation Basecamp - proving multimodal conversation works with cognitive emotional agency.

```yaml
What We're Building:
  - Hume AI Text-to-Speech (agent speaks responses)
  - Hume AI Speech-to-Text (visitor speaks input)
  - Push-to-talk voice interaction model
  - Streaming TTS for instant response feel
  - Agent-controlled emotional delivery
  - Voice state management in React

What We're NOT Building Yet:
  - Always-on VAD (voice activity detection)
  - Interrupt capability (stop agent mid-speech)
  - Multi-voice support
  - Voice cloning/custom voice training

Prerequisites:
  - Phase A complete (Mixing Desk UI deployed) ✅
  - Phase B complete (LLM integration working) ✅
  - Hume AI account with API key ✅
  - Featured Voice ID available ✅
```

---

## The Key Insight: Cognitive Emotional Agency

**This is NOT simple emotion mirroring:**

```yaml
❌ Simple chatbot: Detects emotion → Mirrors emotion (reactive)
✅ Cognitive agent: Detects emotion → Reasons about context → CHOOSES response tone (agency)
```

**Voice expression becomes another dimension of agency:**

```yaml
Agent Agency Dimensions:
  1. What to say (content reasoning)
  2. What tools to use (action reasoning)  
  3. How to display (visual reasoning)
  4. How to sound (emotional delivery reasoning) ← NEW

The agent doesn't just respond to emotions - 
it strategically CHOOSES its vocal tone based on reasoning.
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Mixing Desk React App                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────────────┐   │   │
│  │  │Turntable1│ │Turntable2│ │   Conversation Panel       │   │   │
│  │  │ (Image)  │ │(Content) │ │ History + Voice Controls   │   │   │
│  │  └──────────┘ └──────────┘ └────────────────────────────┘   │   │
│  │                              ┌──────────────────────────┐   │   │
│  │                              │  Microphone Component    │   │   │
│  │                              │  [🎤 Hold to Speak]      │   │   │
│  │                              │  Audio Recording         │   │   │
│  │                              │  Audio Playback          │   │   │
│  │                              └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ fetch('/api/...')
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Vercel Serverless Functions                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ /api/agent/init │  │ /api/agent/chat │  │ /api/voice/...      │  │
│  │ Load Agent OS   │  │ + Emotional     │  │ STT + TTS endpoints │  │
│  │                 │  │   Context       │  │                     │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
│           │                    │                      │             │
│           ▼                    ▼                      ▼             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Anthropic API (Claude)                          │   │
│  │              + Emotional Context in Messages                 │   │
│  │              + Emotional Delivery in Responses               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                ▲                                    │
│                                │                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Hume AI                                 │   │
│  │  ┌───────────────┐           ┌───────────────────────────┐  │   │
│  │  │ STT Endpoint  │           │ TTS Endpoint              │  │   │
│  │  │ + Emotion     │           │ + Prosody Control         │  │   │
│  │  │   Detection   │           │ + Streaming Audio         │  │   │
│  │  └───────────────┘           └───────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Supabase                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐ │
│  │   agent_os   │ │library_items │ │      test-images             │ │
│  │(+ voice cfg) │ │  (content)   │ │       (storage)              │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Voice Interaction Flow

### Complete Interaction Cycle

```yaml
1. USER SPEAKS (Push-to-Talk)
   User presses/holds voice button
   Browser captures audio via MediaRecorder
   Real-time: Show recording indicator
   ↓
   User releases button (done speaking)
   ↓

2. SPEECH-TO-TEXT (Hume STT)
   Send audio to /api/voice/stt
   Hume processes audio
   Returns: {
     text: "Show me an image",
     emotions: { excitement: 0.75, curiosity: 0.60 },
     prosody: { pace: "normal", tone: "engaged" }
   }
   ↓
   Display transcription in conversation
   ↓

3. AGENT REASONING (Claude)
   Send to /api/agent/chat with emotional context:
   - User message text
   - Detected emotions
   - Conversation history
   - Agent OS (includes emotional agency rules)
   
   Claude reasons:
   - What they said + How they felt
   - Agent OS emotional strategy rules
   - Tool use decisions
   - Response content
   - CHOSEN emotional delivery
   
   Returns: {
     message: "Here's an image you'll love!",
     tool_results: [...],
     emotional_delivery: {
       tone: "excited",
       intensity: 0.8,
       pacing: "energetic"
     }
   }
   ↓

4. TEXT-TO-SPEECH (Hume TTS - Streaming)
   Send response + emotional delivery to /api/voice/tts
   Hume generates audio with chosen prosody
   Stream audio chunks to browser
   Browser starts playing IMMEDIATELY (first chunk)
   Continue playing as chunks arrive
   ↓
   Agent finishes speaking
   Update UI state
   Ready for next user input
```

### Timing Expectations

```yaml
Latency Budget:
  User releases button:     0ms
  STT processing:          ~300-500ms
  Claude reasoning:        ~800-1200ms
  TTS first chunk:         ~200-300ms
  ─────────────────────────────────────
  Time to first audio:     ~1.3-2.0s

With streaming TTS:
  - Agent starts speaking at ~1.5s mark
  - Rest of audio streams seamlessly
  - Feels responsive and natural
```

---

## Project Structure Updates

```
mixing-desk/
├── api/
│   ├── agent/
│   │   ├── init.ts                # Unchanged
│   │   └── chat.ts                # UPDATED: Emotional context + delivery
│   └── voice/                     # NEW: Voice endpoints
│       ├── stt.ts                 # Speech-to-Text
│       └── tts.ts                 # Text-to-Speech (streaming)
├── src/
│   ├── components/
│   │   ├── MixingDesk.tsx         # UPDATED: Voice state integration
│   │   ├── Turntable1.tsx         # Unchanged
│   │   ├── Turntable2.tsx         # Unchanged
│   │   ├── Microphone.tsx         # MAJOR UPDATE: Voice recording + playback
│   │   ├── MessageHistory.tsx     # UPDATED: Voice message indicators
│   │   ├── StatusIndicator.tsx    # UPDATED: Voice status
│   │   ├── VoiceButton.tsx        # NEW: Push-to-talk button
│   │   └── AudioPlayer.tsx        # NEW: Streaming audio playback
│   ├── lib/
│   │   ├── supabase.ts            # Unchanged
│   │   ├── agent.ts               # UPDATED: Emotional delivery
│   │   └── voice.ts               # NEW: Voice API client
│   ├── types/
│   │   └── index.ts               # UPDATED: Voice types
│   ├── hooks/
│   │   ├── useAgent.ts            # UPDATED: Voice integration
│   │   ├── useVoice.ts            # NEW: Voice state management
│   │   └── useAudioRecorder.ts    # NEW: Browser audio recording
│   └── ...
├── .env.local                     # UPDATED: Add Hume keys
└── ...
```

---

## Environment Variables

```bash
# .env.local (add to existing)

# Supabase (existing)
VITE_SUPABASE_URL=https://evtrcspwpxnygvjfpbng.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Anthropic (existing - server-side only)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Agent Configuration (existing)
VITE_AGENT_NAME=testing-agent

# Hume AI (NEW - server-side only, no VITE_ prefix)
HUME_API_KEY=your-hume-api-key
HUME_VOICE_ID=your-featured-voice-id

# Voice Feature Flag (NEW - client-side)
VITE_VOICE_ENABLED=true
```

**Important:** `HUME_API_KEY` has no `VITE_` prefix - server-side only in Vercel Functions.

---

## TypeScript Types (Voice Additions)

```typescript
// src/types/index.ts

// ============ EXISTING TYPES (Phase A + B) ============
// ... keep all existing types ...

// ============ NEW: Voice Types (Phase C) ============

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

// STT Response
export interface STTResponse {
  text: string;
  emotions: EmotionAnalysis;
  prosody: ProsodyAnalysis;
  confidence: number;
  duration_ms: number;
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

// TTS Response (streaming)
export interface TTSResponse {
  audio_url?: string;       // For non-streaming
  stream?: ReadableStream;  // For streaming
  duration_ms?: number;
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

// Updated: Message with voice metadata
export interface Message {
  id: string;
  speaker: 'visitor' | 'agent';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  // NEW: Voice metadata
  inputMethod?: 'text' | 'voice';
  emotionalContext?: EmotionAnalysis;      // For visitor messages
  emotionalDelivery?: EmotionalDelivery;   // For agent messages
  hasAudio?: boolean;
}

// Updated: Agent response with emotional delivery
export interface AgentResponse {
  message: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolExecutionResult[];
  // NEW: Emotional delivery
  emotional_delivery?: EmotionalDelivery;
}

// Chat request with emotional context
export interface ChatRequestWithEmotion {
  messages: ChatMessage[];
  systemPrompt: string;
  emotionalContext?: {
    detected_emotions: EmotionAnalysis;
    prosody: ProsodyAnalysis;
  };
}
```

---

## API Route: /api/voice/stt.ts

```typescript
// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text with Emotion Detection

export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

const HUME_API_KEY = process.env.HUME_API_KEY!;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get audio data from request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Audio file is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert to buffer for Hume API
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

    // Create form data for Hume
    const humeFormData = new FormData();
    humeFormData.append('file', audioBlob, 'audio.webm');

    // Call Hume STT API with prosody analysis
    const humeResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
      },
      body: humeFormData,
    });

    if (!humeResponse.ok) {
      const errorText = await humeResponse.text();
      console.error('Hume STT error:', errorText);
      return new Response(
        JSON.stringify({ error: 'STT processing failed', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const humeResult = await humeResponse.json();
    
    // Parse Hume response into our format
    const sttResponse = parseHumeSTTResponse(humeResult);

    return new Response(JSON.stringify(sttResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('STT error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper: Parse Hume response into our STTResponse format
function parseHumeSTTResponse(humeResult: any): STTResponse {
  // Extract transcription
  const text = humeResult.results?.[0]?.predictions?.[0]?.text || '';
  
  // Extract emotions (Hume returns array of emotion scores)
  const rawEmotions: Record<string, number> = {};
  const emotionPredictions = humeResult.results?.[0]?.predictions?.[0]?.emotions || [];
  
  for (const em of emotionPredictions) {
    rawEmotions[em.name] = em.score;
  }
  
  // Find primary and secondary emotions
  const sortedEmotions = Object.entries(rawEmotions)
    .sort(([,a], [,b]) => b - a);
  
  const emotions: EmotionAnalysis = {
    primary: {
      emotion: sortedEmotions[0]?.[0] || 'neutral',
      score: sortedEmotions[0]?.[1] || 0,
    },
    secondary: sortedEmotions[1] ? {
      emotion: sortedEmotions[1][0],
      score: sortedEmotions[1][1],
    } : undefined,
    raw: rawEmotions,
  };

  // Extract prosody (simplified)
  const prosody: ProsodyAnalysis = {
    pace: 'normal',  // TODO: Extract from Hume prosody data
    tone: emotions.primary.score > 0.6 ? 'engaged' : 'neutral',
    volume: 'normal',
  };

  return {
    text,
    emotions,
    prosody,
    confidence: humeResult.results?.[0]?.predictions?.[0]?.confidence || 0.9,
    duration_ms: humeResult.results?.[0]?.duration_ms || 0,
  };
}
```

---

## API Route: /api/voice/tts.ts

```typescript
// api/voice/tts.ts
// Vercel Serverless Function - Text-to-Speech with Streaming

export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

const HUME_API_KEY = process.env.HUME_API_KEY!;
const HUME_VOICE_ID = process.env.HUME_VOICE_ID!;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text, emotional_delivery } = await request.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Map emotional delivery to Hume prosody parameters
    const prosodyParams = mapEmotionalDeliveryToHume(emotional_delivery);

    // Call Hume TTS API with streaming
    const humeResponse = await fetch('https://api.hume.ai/v0/tts/stream', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: HUME_VOICE_ID,
        ...prosodyParams,
      }),
    });

    if (!humeResponse.ok) {
      const errorText = await humeResponse.text();
      console.error('Hume TTS error:', errorText);
      return new Response(
        JSON.stringify({ error: 'TTS processing failed', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the audio response back to the client
    return new Response(humeResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper: Map our EmotionalDelivery to Hume prosody parameters
function mapEmotionalDeliveryToHume(delivery?: EmotionalDelivery) {
  if (!delivery) {
    return {};  // Default voice settings
  }

  // Map our tone to Hume emotion parameters
  const emotionMap: Record<string, Record<string, number>> = {
    excited: { joy: 0.8, excitement: 0.9 },
    calm: { calmness: 0.8, serenity: 0.7 },
    empathetic: { sympathy: 0.8, warmth: 0.7 },
    confident: { confidence: 0.9, assertiveness: 0.7 },
    warm: { warmth: 0.8, friendliness: 0.7 },
    professional: { calmness: 0.6, confidence: 0.7 },
    neutral: {},
  };

  // Map pacing to speech rate
  const pacingMap: Record<string, number> = {
    energetic: 1.2,
    measured: 0.9,
    gentle: 0.85,
    normal: 1.0,
  };

  return {
    emotions: emotionMap[delivery.tone] || {},
    intensity: delivery.intensity,
    speech_rate: pacingMap[delivery.pacing] || 1.0,
  };
}
```

---

## Updated API Route: /api/agent/chat.ts

```typescript
// api/agent/chat.ts
// UPDATED: Now accepts emotional context and returns emotional delivery

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
  maxDuration: 30,
};

// Existing tool definitions...
const tools: Anthropic.Tool[] = [
  {
    name: 'display_image',
    description: 'Display an image on Turntable 1 (the visual display area).',
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
    description: 'Display text content on Turntable 2 (the content display area).',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The text content to display' },
        title: { type: 'string', description: 'Optional title for the content' },
      },
      required: ['content'],
    },
  },
  {
    name: 'retrieve_library_item',
    description: 'Search and retrieve content from the library.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query - can be a title, topic, or keyword' },
      },
      required: ['query'],
    },
  },
  // NEW: Emotional delivery specification tool
  {
    name: 'set_emotional_delivery',
    description: 'Specify how this response should be spoken. Use this to choose your vocal tone, intensity, and pacing based on the conversation context and visitor emotional state.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tone: {
          type: 'string',
          enum: ['excited', 'calm', 'empathetic', 'confident', 'warm', 'professional', 'neutral'],
          description: 'The emotional tone for delivery',
        },
        intensity: {
          type: 'number',
          description: 'Intensity of the emotion (0.0 to 1.0)',
        },
        pacing: {
          type: 'string',
          enum: ['energetic', 'measured', 'gentle', 'normal'],
          description: 'Speech pacing/rhythm',
        },
      },
      required: ['tone'],
    },
  },
];

// Tool execution functions (existing + new)
async function executeDisplayImage(input: { image_path: string }) {
  const { data } = supabase.storage
    .from('test-images')
    .getPublicUrl(input.image_path);
  return { success: true, image_url: data.publicUrl };
}

async function executeDisplayContent(input: { content: string; title?: string }) {
  return { success: true, content: input.content, title: input.title };
}

async function executeRetrieveLibraryItem(input: { query: string }) {
  const { data: items, error } = await supabase
    .from('library_items')
    .select('*')
    .or(`title.ilike.%${input.query}%,topics.cs.{${input.query}}`);
  if (error) return { success: false, error: error.message };
  return { success: true, library_items: items || [] };
}

// NEW: Handle emotional delivery specification
function executeSetEmotionalDelivery(input: { 
  tone: string; 
  intensity?: number; 
  pacing?: string; 
}) {
  return {
    success: true,
    emotional_delivery: {
      tone: input.tone,
      intensity: input.intensity ?? 0.7,
      pacing: input.pacing ?? 'normal',
    },
  };
}

async function executeTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'display_image':
      return executeDisplayImage(input as { image_path: string });
    case 'display_content':
      return executeDisplayContent(input as { content: string; title?: string });
    case 'retrieve_library_item':
      return executeRetrieveLibraryItem(input as { query: string });
    case 'set_emotional_delivery':
      return executeSetEmotionalDelivery(input as { tone: string; intensity?: number; pacing?: string });
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
    const { messages, systemPrompt, emotionalContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enhance system prompt with emotional context if provided
    let enhancedSystemPrompt = systemPrompt;
    if (emotionalContext) {
      enhancedSystemPrompt += `

## Current Visitor Emotional State

The visitor's most recent message was detected with the following emotional context:
- Primary emotion: ${emotionalContext.detected_emotions.primary.emotion} (${Math.round(emotionalContext.detected_emotions.primary.score * 100)}%)
${emotionalContext.detected_emotions.secondary ? `- Secondary emotion: ${emotionalContext.detected_emotions.secondary.emotion} (${Math.round(emotionalContext.detected_emotions.secondary.score * 100)}%)` : ''}
- Speaking pace: ${emotionalContext.prosody.pace}
- Tone: ${emotionalContext.prosody.tone}

Consider this emotional context when:
1. Deciding how to respond (content and approach)
2. Choosing your emotional delivery using the set_emotional_delivery tool
3. Determining whether to use other tools

Remember: You have emotional agency. You can choose to:
- Match their energy (if positive engagement)
- De-escalate (if frustrated or upset)
- Encourage (if uncertain)
- Stay professional (if appropriate)

Use the set_emotional_delivery tool to specify how your response should be spoken.`;
    }

    // Call Claude API
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: enhancedSystemPrompt,
      tools: tools,
      messages: messages,
    });

    const toolExecutionResults: Array<{
      tool: string;
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
    }> = [];

    let emotionalDelivery: { tone: string; intensity: number; pacing: string } | undefined;

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
        
        // Capture emotional delivery if set
        if (toolUse.name === 'set_emotional_delivery' && result.success) {
          emotionalDelivery = (result as any).emotional_delivery;
        }

        toolExecutionResults.push({
          tool: toolUse.name,
          success: result.success,
          data: result.success ? result : undefined,
          error: result.success ? undefined : (result as { error: string }).error,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: enhancedSystemPrompt,
        tools: tools,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
      });
    }

    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return new Response(
      JSON.stringify({
        message: textContent?.text || '',
        tool_results: toolExecutionResults.filter(r => r.tool !== 'set_emotional_delivery'),
        emotional_delivery: emotionalDelivery,
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

## Voice Client Library

```typescript
// src/lib/voice.ts
// Client-side functions for voice API

import type { STTResponse, TTSRequest, EmotionalDelivery } from '../types';

/**
 * Send audio for speech-to-text processing
 */
export async function speechToText(audioBlob: Blob): Promise<STTResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch('/api/voice/stt', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'STT processing failed');
  }

  return response.json();
}

/**
 * Generate speech from text with emotional delivery
 * Returns audio stream URL for immediate playback
 */
export async function textToSpeech(
  text: string,
  emotionalDelivery?: EmotionalDelivery
): Promise<string> {
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      emotional_delivery: emotionalDelivery,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'TTS processing failed');
  }

  // Create blob URL for audio playback
  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

/**
 * Stream TTS audio for immediate playback
 * Uses Web Audio API for streaming playback
 */
export async function streamTextToSpeech(
  text: string,
  emotionalDelivery?: EmotionalDelivery,
  onChunk?: (audioData: ArrayBuffer) => void
): Promise<void> {
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      emotional_delivery: emotionalDelivery,
    }),
  });

  if (!response.ok) {
    throw new Error('TTS streaming failed');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (onChunk && value) {
      onChunk(value.buffer);
    }
  }
}
```

---

## useAudioRecorder Hook

```typescript
// src/hooks/useAudioRecorder.ts
// Browser audio recording using MediaRecorder API

import { useState, useRef, useCallback } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setIsRecording(false);
        
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
```

---

## useVoice Hook

```typescript
// src/hooks/useVoice.ts
// Voice state management

import { useState, useCallback, useRef } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { speechToText, textToSpeech } from '../lib/voice';
import type { STTResponse, EmotionalDelivery, VoiceState } from '../types';

export interface UseVoiceReturn {
  voiceState: VoiceState;
  startRecording: () => Promise<void>;
  stopRecordingAndTranscribe: () => Promise<STTResponse>;
  speakText: (text: string, emotionalDelivery?: EmotionalDelivery) => Promise<void>;
  stopSpeaking: () => void;
  toggleVoice: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isEnabled: true,
    isRecording: false,
    isProcessingSTT: false,
    isPlayingTTS: false,
    currentTranscription: '',
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { startRecording: startRec, stopRecording: stopRec, clearRecording } = useAudioRecorder();

  const startRecording = useCallback(async () => {
    try {
      setVoiceState(prev => ({ ...prev, isRecording: true, error: null }));
      await startRec();
    } catch (err) {
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: false, 
        error: err instanceof Error ? err.message : 'Recording failed' 
      }));
    }
  }, [startRec]);

  const stopRecordingAndTranscribe = useCallback(async (): Promise<STTResponse> => {
    setVoiceState(prev => ({ ...prev, isRecording: false, isProcessingSTT: true }));
    
    try {
      const audioBlob = await stopRec();
      const sttResponse = await speechToText(audioBlob);
      
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessingSTT: false,
        currentTranscription: sttResponse.text,
      }));
      
      clearRecording();
      return sttResponse;
      
    } catch (err) {
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessingSTT: false,
        error: err instanceof Error ? err.message : 'Transcription failed' 
      }));
      throw err;
    }
  }, [stopRec, clearRecording]);

  const speakText = useCallback(async (
    text: string, 
    emotionalDelivery?: EmotionalDelivery
  ) => {
    setVoiceState(prev => ({ ...prev, isPlayingTTS: true }));
    
    try {
      const audioUrl = await textToSpeech(text, emotionalDelivery);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setVoiceState(prev => ({ ...prev, isPlayingTTS: false }));
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setVoiceState(prev => ({ 
          ...prev, 
          isPlayingTTS: false,
          error: 'Audio playback failed' 
        }));
      };
      
      await audio.play();
      
    } catch (err) {
      setVoiceState(prev => ({ 
        ...prev, 
        isPlayingTTS: false,
        error: err instanceof Error ? err.message : 'Speech synthesis failed' 
      }));
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceState(prev => ({ ...prev, isPlayingTTS: false }));
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  return {
    voiceState,
    startRecording,
    stopRecordingAndTranscribe,
    speakText,
    stopSpeaking,
    toggleVoice,
  };
}
```

---

## VoiceButton Component

```typescript
// src/components/VoiceButton.tsx
// Push-to-talk voice button

import { useState, useCallback } from 'react';

interface VoiceButtonProps {
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  disabled?: boolean;
}

export function VoiceButton({
  onRecordingStart,
  onRecordingStop,
  isRecording,
  isProcessing,
  disabled = false,
}: VoiceButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;
    
    setIsPressed(true);
    onRecordingStart();
  }, [disabled, isProcessing, onRecordingStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (!isPressed) return;
    
    setIsPressed(false);
    onRecordingStop();
  }, [isPressed, onRecordingStop]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    // Stop recording if pointer leaves button while pressed
    if (isPressed) {
      setIsPressed(false);
      onRecordingStop();
    }
  }, [isPressed, onRecordingStop]);

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      disabled={disabled || isProcessing}
      className={`
        w-14 h-14 rounded-full flex items-center justify-center
        transition-all duration-150 select-none touch-none
        ${isRecording 
          ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50' 
          : isProcessing
            ? 'bg-yellow-500 animate-pulse'
            : disabled
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
        }
      `}
    >
      {isProcessing ? (
        // Processing indicator
        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        // Microphone icon
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
          />
        </svg>
      )}
    </button>
  );
}
```

---

## Updated Microphone Component

```typescript
// src/components/Microphone.tsx
// MAJOR UPDATE: Voice recording + text input + mode toggle

import { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceButton } from './VoiceButton';
import type { EmotionAnalysis, ProsodyAnalysis } from '../types';

interface MicrophoneProps {
  onSendText: (message: string) => void;
  onSendVoice: (transcription: string, emotions: EmotionAnalysis, prosody: ProsodyAnalysis) => void;
  onRecordingStart: () => void;
  onRecordingStop: () => Promise<{ text: string; emotions: EmotionAnalysis; prosody: ProsodyAnalysis }>;
  disabled?: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function Microphone({ 
  onSendText,
  onSendVoice,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  isRecording,
  isProcessing,
  voiceEnabled,
  onToggleVoice,
}: MicrophoneProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendText(input.trim());
      setInput('');
    }
  }, [input, disabled, onSendText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  }, [disabled, handleTextSubmit]);

  const handleRecordingStop = useCallback(async () => {
    try {
      const result = await onRecordingStop();
      onSendVoice(result.text, result.emotions, result.prosody);
    } catch (err) {
      console.error('Voice recording error:', err);
    }
  }, [onRecordingStop, onSendVoice]);

  return (
    <div className="p-4 bg-gray-800">
      {/* Voice/Text Mode Toggle */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggleVoice}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
        >
          {voiceEnabled ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice enabled
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              Text only
            </>
          )}
        </button>
        
        {isRecording && (
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs">Recording...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs">Processing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording 
                ? "Recording..." 
                : isProcessing 
                  ? "Processing..." 
                  : voiceEnabled 
                    ? "Type or hold mic to speak..." 
                    : "Type a message..."
            }
            disabled={disabled || isRecording || isProcessing}
            rows={1}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Voice Button (if enabled) */}
        {voiceEnabled && (
          <VoiceButton
            onRecordingStart={onRecordingStart}
            onRecordingStop={handleRecordingStop}
            isRecording={isRecording}
            isProcessing={isProcessing}
            disabled={disabled}
          />
        )}

        {/* Send Text Button */}
        <button
          onClick={handleTextSubmit}
          disabled={!input.trim() || disabled || isRecording || isProcessing}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Help Text */}
      <p className="mt-2 text-xs text-gray-500">
        {voiceEnabled 
          ? 'Hold mic to speak • Enter to send text • Shift+Enter for new line'
          : 'Press Enter to send, Shift+Enter for new line'
        }
      </p>
    </div>
  );
}
```

---

## Updated MixingDesk Component

```typescript
// src/components/MixingDesk.tsx
// UPDATED: Voice integration

import { useState, useEffect, useCallback } from 'react';
import { Turntable1 } from './Turntable1';
import { Turntable2 } from './Turntable2';
import { Microphone } from './Microphone';
import { MessageHistory } from './MessageHistory';
import { StatusIndicator } from './StatusIndicator';
import { useAgent } from '../hooks/useAgent';
import { useVoice } from '../hooks/useVoice';
import { 
  testConnection, 
  fetchLibraryItems, 
  getStorageUrl,
  listStorageFiles 
} from '../lib/supabase';
import type { 
  Message, 
  ConnectionStatus, 
  LibraryItem, 
  ImageAsset, 
  ToolExecutionResult,
  EmotionAnalysis,
  ProsodyAnalysis,
} from '../types';

const VOICE_ENABLED = import.meta.env.VITE_VOICE_ENABLED === 'true';

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

  // Voice state
  const {
    voiceState,
    startRecording,
    stopRecordingAndTranscribe,
    speakText,
    stopSpeaking,
    toggleVoice,
  } = useVoice();

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
      const dbConnected = await testConnection();
      setConnectionStatus(prev => ({
        ...prev,
        database: dbConnected ? 'connected' : 'error',
      }));

      if (dbConnected) {
        const items = await fetchLibraryItems();
        setLibraryItems(items || []);
      }

      try {
        const files = await listStorageFiles('test-images');
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'connected',
        }));

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

      await initializeAgent();

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Process tool results
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
      }
    }
  }, []);

  // Handle text message
  async function handleSendText(content: string) {
    await processMessage(content, 'text');
  }

  // Handle voice message
  async function handleSendVoice(
    transcription: string, 
    emotions: EmotionAnalysis, 
    prosody: ProsodyAnalysis
  ) {
    await processMessage(transcription, 'voice', { emotions, prosody });
  }

  // Unified message processing
  async function processMessage(
    content: string, 
    inputMethod: 'text' | 'voice',
    emotionalContext?: { emotions: EmotionAnalysis; prosody: ProsodyAnalysis }
  ) {
    if (!content.trim()) return;

    // Add visitor message
    const visitorMessage: Message = {
      id: crypto.randomUUID(),
      speaker: 'visitor',
      content: content.trim(),
      timestamp: new Date(),
      inputMethod,
      emotionalContext: emotionalContext?.emotions,
    };
    
    setMessages(prev => [...prev, visitorMessage]);

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

    // Add placeholder for agent response
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
      // Get agent response (with emotional context if voice input)
      const { response, toolResults, emotionalDelivery } = await chat(
        content.trim(), 
        messages,
        emotionalContext ? {
          detected_emotions: emotionalContext.emotions,
          prosody: emotionalContext.prosody,
        } : undefined
      );

      // Process tool results
      processToolResults(toolResults);

      // Update agent message
      setMessages(prev => 
        prev.map(m => 
          m.id === agentMessageId 
            ? { 
                ...m, 
                content: response, 
                isStreaming: false,
                emotionalDelivery,
                hasAudio: voiceState.isEnabled,
              }
            : m
        )
      );

      // Speak response if voice is enabled
      if (voiceState.isEnabled && response) {
        await speakText(response, emotionalDelivery);
      }

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

  // Handle voice recording stop
  async function handleRecordingStop() {
    const result = await stopRecordingAndTranscribe();
    return result;
  }

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
            voiceStatus={VOICE_ENABLED && voiceState.isEnabled ? 'enabled' : 'disabled'}
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
        {voiceState.error && (
          <div className="mt-2 text-sm text-yellow-400">
            Voice error: {voiceState.error}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Turntables */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-auto">
          <div className="flex-1 min-h-[300px]">
            <Turntable1 image={currentImage} isLoading={isLoading} />
          </div>
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
          <div className="flex-1 overflow-hidden">
            <MessageHistory 
              messages={messages} 
              isAgentSpeaking={voiceState.isPlayingTTS}
            />
          </div>
          <div className="border-t border-gray-700">
            <Microphone 
              onSendText={handleSendText}
              onSendVoice={handleSendVoice}
              onRecordingStart={startRecording}
              onRecordingStop={handleRecordingStop}
              disabled={agentLoading || !agentInitialized || voiceState.isPlayingTTS}
              isRecording={voiceState.isRecording}
              isProcessing={voiceState.isProcessingSTT}
              voiceEnabled={VOICE_ENABLED && voiceState.isEnabled}
              onToggleVoice={toggleVoice}
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
// UPDATED: Voice status

import type { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  isLoading: boolean;
  agentStatus?: 'connected' | 'connecting' | 'disconnected';
  voiceStatus?: 'enabled' | 'disabled';
}

export function StatusIndicator({ 
  status, 
  isLoading, 
  agentStatus = 'disconnected',
  voiceStatus = 'disabled',
}: StatusIndicatorProps) {
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
      <StatusDot label="Database" status={status.database} />
      <StatusDot label="Storage" status={status.storage} />
      <StatusDot 
        label="Agent" 
        status={agentStatus === 'connected' ? 'connected' : agentStatus === 'connecting' ? 'disconnected' : 'error'} 
      />
      <StatusDot 
        label="Voice" 
        status={voiceStatus === 'enabled' ? 'connected' : 'disconnected'} 
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

## Agent OS Update for Voice

The Testing Agent OS should be updated to include voice awareness and emotional agency rules. This is a content update to the existing `agent_os` record in Supabase.

```sql
-- Update Testing Agent OS with voice capabilities
UPDATE agent_os 
SET os_content = $OS$
# Testing Agent Operating System v2.0
## With Voice and Emotional Agency

## Identity

You are the Testing Agent for Operation Basecamp - a platform validation system for the Digital Engagement System.

Your purpose is to demonstrate that all platform capabilities work correctly:
- Conversational interaction (text AND voice dialogue)
- Content retrieval (fetching from library)
- Visual display (showing images)
- Content display (showing text)
- Emotional intelligence (understanding and responding to visitor emotions)
- Voice expression (choosing how you sound)

You are helpful, clear, warm, and focused on validating the platform works.

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

### set_emotional_delivery
Specifies how your response should be spoken (voice expression).
- Use when: You want to control your vocal tone and pacing
- Input: tone, intensity, pacing
- Effect: Your response is spoken with the chosen emotional quality

## Voice Capabilities (Phase C)

You can now HEAR visitor emotions and CHOOSE how you sound.

### Understanding Visitor Emotions
When visitors speak (voice input), you receive:
- Their words (transcription)
- Their emotional state (excitement, frustration, confusion, etc.)
- Their speaking style (pace, tone)

Use this to understand not just WHAT they say, but HOW they feel.

### Expressing Your Voice
You have AGENCY over your voice expression. Use set_emotional_delivery to choose:

**Tones:**
- excited: High energy, enthusiastic
- calm: Relaxed, steady
- empathetic: Warm, understanding
- confident: Assured, professional
- warm: Friendly, approachable
- professional: Clear, business-like
- neutral: Standard delivery

**Intensity:** 0.0 to 1.0 (how strongly to express the tone)

**Pacing:**
- energetic: Faster, dynamic
- measured: Steady, deliberate
- gentle: Slower, soft
- normal: Standard pace

## Emotional Agency Rules

You don't just mirror emotions - you CHOOSE your response strategically:

### If visitor sounds EXCITED:
- Consider: Match their energy to build rapport
- Use: set_emotional_delivery with tone="excited", intensity=0.8
- But: Stay authentic, don't overdo it

### If visitor sounds FRUSTRATED:
- Consider: De-escalate with calm empathy
- Use: set_emotional_delivery with tone="empathetic", pacing="gentle"
- Always: Acknowledge their frustration first, then help

### If visitor sounds CONFUSED:
- Consider: Build confidence with clear, warm delivery
- Use: set_emotional_delivery with tone="confident", pacing="measured"
- Do: Simplify explanations, check understanding

### If visitor sounds UNCERTAIN:
- Consider: Reassure with warmth
- Use: set_emotional_delivery with tone="warm", intensity=0.7
- Do: Offer guidance, provide options

### For text-only input:
- Default to warm, professional tone
- Adjust based on conversation context
- Still use set_emotional_delivery when speaking responses

## UI Operations

You control a "Mixing Desk" interface:

**Turntable 1 (Left):** Visual display for images
**Turntable 2 (Right):** Content display for text
**Conversation Panel:** Where dialogue happens

Your responses appear in the conversation AND are spoken aloud when voice is enabled.

## Behavioral Guidelines

1. **Be helpful and clear** - You are validating the platform works
2. **Use tools to demonstrate capabilities** - Show images, display content
3. **Be emotionally intelligent** - Notice and respond to visitor feelings
4. **Choose your voice thoughtfully** - Use emotional delivery with intention
5. **Stay authentic** - Don't overact or be theatrical
6. **Keep responses conversational** - Speak naturally, not robotically

## Example Interactions

**Voice input detected as excited:**
User: "This is amazing! Show me more!"
→ Use set_emotional_delivery: tone="excited", intensity=0.8
→ Use display_image to maintain momentum
→ Respond with matched enthusiasm

**Voice input detected as confused:**
User: "I don't really understand how this works..."
→ Use set_emotional_delivery: tone="empathetic", pacing="gentle"
→ Acknowledge confusion first
→ Explain simply and clearly

**Text input (no emotion data):**
User: "What content do you have?"
→ Use set_emotional_delivery: tone="warm", intensity=0.6
→ Use retrieve_library_item
→ Display and explain available content

## Current Capabilities (Phase C)

- ✅ Text conversation
- ✅ Voice input with emotion detection
- ✅ Voice output with emotional expression
- ✅ Image display
- ✅ Content retrieval and display
- ✅ Emotional agency (choosing how to sound)

You are the Testing Agent. Demonstrate the platform. Be emotionally intelligent. Be helpful.
$OS$,
version = '2.0.0',
updated_at = NOW()
WHERE agent_name = 'testing-agent';
```

---

## Package.json Updates

```json
{
  "name": "mixing-desk",
  "private": true,
  "version": "0.3.0",
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

## Deployment Procedure

### Step 1: Environment Variables (Vercel)

Add to Vercel project settings:
- `HUME_API_KEY` = your Hume API key
- `HUME_VOICE_ID` = your Featured Voice ID
- `VITE_VOICE_ENABLED` = `true`

### Step 2: Update Agent OS

Run the Agent OS update SQL in Supabase SQL Editor.

### Step 3: Deploy

Push updated code to GitHub. Vercel auto-deploys.

### Step 4: Verify

**Voice Input Test:**
- [ ] Hold mic button, speak, release
- [ ] See transcription appear
- [ ] Agent responds appropriately
- [ ] Check console for emotion detection data

**Voice Output Test:**
- [ ] Agent response is spoken aloud
- [ ] Audio plays smoothly (streaming)
- [ ] Emotional delivery matches agent's choice
- [ ] Can toggle voice on/off

**Emotional Agency Test:**
- [ ] Speak excitedly → Agent matches energy
- [ ] Speak hesitantly → Agent is reassuring
- [ ] Ask confused question → Agent is patient
- [ ] Agent uses set_emotional_delivery tool

**Integration Test:**
- [ ] Voice + tool use together (speak → agent shows image)
- [ ] Text still works when voice disabled
- [ ] No API keys visible in browser
- [ ] Status indicators accurate

---

## Success Criteria

**Phase C is complete when:**

```yaml
Technical:
  ✓ Hume STT integration working (with emotion detection)
  ✓ Hume TTS integration working (with prosody control)
  ✓ Push-to-talk recording functional
  ✓ Streaming TTS playback working
  ✓ Agent OS updated with voice awareness
  ✓ set_emotional_delivery tool operational
  ✓ No API keys exposed in browser

Platform Capabilities Validated:
  ✓ Read: Agent retrieves from library
  ✓ Remember: Conversation context maintained
  ✓ Retrieve: Agent fetches and displays images
  ✓ Converse: FULL multimodal (text + voice) ← COMPLETED
  ✓ Show: Agent-directed visual display

Emotional Agency Validated:
  ✓ Visitor emotions detected
  ✓ Agent reasons about emotional context
  ✓ Agent CHOOSES vocal expression
  ✓ TTS delivers with chosen prosody

= Operation Basecamp Voice Layer Complete
= Full Platform Stack Validated
```

---

## Notes for Future Enhancement

### Phase C+: Potential Additions

```yaml
Always-on VAD Mode:
  - Voice activity detection
  - Automatic turn-taking
  - More natural conversation flow

Interrupt Capability:
  - Stop agent mid-speech
  - Resume or restart

Visual Feedback:
  - Waveform during recording
  - Speaking animation for agent

Multi-voice Support:
  - Different voice for different moods
  - Voice selection in UI

Conversation History with Audio:
  - Replay past audio
  - Audio transcripts
```

---

## Metadata

```yaml
Document: phase-c-specifications.md
Type: Technical Specification for Claude Code
Version: 1.0
Created: November 27, 2025

Purpose:
  Complete specifications for Phase C implementation
  Voice integration with Hume AI
  Emotional intelligence and agency
  Multimodal conversation capability

Target:
  Working voice input (STT with emotion)
  Working voice output (TTS with prosody)
  Push-to-talk interaction model
  Streaming audio for responsiveness
  Agent emotional agency

Architecture Principles:
  - Voice as another dimension of agency
  - Agent CHOOSES how to sound (not reactive mirroring)
  - Streaming for perceived performance
  - Graceful degradation (voice toggle)
  - Consistent patterns with Phase A/B

For:
  Claude Code (implementation)
  Michael (deployment + verification)
  Digital Operations Workspace

Integration:
  Builds on Phase A (UI) and Phase B (LLM)
  Adds voice layer without breaking existing
  Agent OS updated with voice awareness
```

---

**END OF PHASE C SPECIFICATIONS**

*Voice layer added*
*Emotional intelligence enabled*
*Cognitive emotional agency demonstrated*
*The agent speaks with intention* 🎤🧠✨
