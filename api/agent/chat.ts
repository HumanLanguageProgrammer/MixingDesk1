// api/agent/chat.ts
// Vercel Serverless Function - Handles conversation with Claude

import { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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
  // Phase C: Emotional delivery tool
  {
    name: 'set_emotional_delivery',
    description: 'Specify how this response should be spoken. Use this to choose your vocal tone, intensity, and pacing based on the conversation context and visitor emotional state. This gives you agency over your voice expression.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tone: {
          type: 'string',
          enum: ['excited', 'calm', 'empathetic', 'confident', 'warm', 'professional', 'neutral'],
          description: 'The emotional tone for delivery. Choose based on visitor emotion and context.',
        },
        intensity: {
          type: 'number',
          description: 'Intensity of the emotion (0.0 to 1.0). Higher values mean more expressive.',
        },
        pacing: {
          type: 'string',
          enum: ['energetic', 'measured', 'gentle', 'normal'],
          description: 'Speech pacing/rhythm. Energetic for excitement, gentle for reassurance, measured for clarity.',
        },
      },
      required: ['tone'],
    },
  },
];

// Tool execution functions
async function executeDisplayImage(input: { image_path: string }, supabase: any) {
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

async function executeRetrieveLibraryItem(input: { query: string }, supabase: any) {
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

// Phase C: Handle emotional delivery specification
interface EmotionalDelivery {
  tone: string;
  intensity: number;
  pacing: string;
}

function executeSetEmotionalDelivery(input: {
  tone: string;
  intensity?: number;
  pacing?: string;
}): { success: boolean; emotional_delivery: EmotionalDelivery } {
  return {
    success: true,
    emotional_delivery: {
      tone: input.tone,
      intensity: input.intensity ?? 0.7,
      pacing: input.pacing ?? 'normal',
    },
  };
}

// Execute a tool call
async function executeTool(name: string, input: Record<string, unknown>, supabase: any) {
  switch (name) {
    case 'display_image':
      return executeDisplayImage(input as { image_path: string }, supabase);
    case 'display_content':
      return executeDisplayContent(input as { content: string; title?: string });
    case 'retrieve_library_item':
      return executeRetrieveLibraryItem(input as { query: string }, supabase);
    case 'set_emotional_delivery':
      return executeSetEmotionalDelivery(input as { tone: string; intensity?: number; pacing?: string });
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!anthropicKey) {
      console.error('Missing ANTHROPIC_API_KEY');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'ANTHROPIC_API_KEY not configured'
      });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Supabase credentials not configured'
      });
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { messages, systemPrompt, emotionalContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    if (!systemPrompt) {
      return res.status(400).json({ error: 'systemPrompt is required' });
    }

    console.log('Processing chat request with', messages.length, 'messages');

    // Phase C: Enhance system prompt with emotional context if provided
    let enhancedSystemPrompt = systemPrompt;
    if (emotionalContext) {
      enhancedSystemPrompt += `

## Current Visitor Emotional State

The visitor's most recent message was detected with the following emotional context:
- Primary emotion: ${emotionalContext.detected_emotions?.primary?.emotion || 'unknown'} (${Math.round((emotionalContext.detected_emotions?.primary?.score || 0) * 100)}%)
${emotionalContext.detected_emotions?.secondary ? `- Secondary emotion: ${emotionalContext.detected_emotions.secondary.emotion} (${Math.round(emotionalContext.detected_emotions.secondary.score * 100)}%)` : ''}
- Speaking pace: ${emotionalContext.prosody?.pace || 'normal'}
- Tone: ${emotionalContext.prosody?.tone || 'neutral'}

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

    // Collect tool results to send back to UI
    const toolExecutionResults: Array<{
      tool: string;
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
    }> = [];

    // Phase C: Track emotional delivery choice
    let emotionalDelivery: EmotionalDelivery | undefined;

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>, supabase);

        // Phase C: Capture emotional delivery if set
        if (toolUse.name === 'set_emotional_delivery' && result.success) {
          emotionalDelivery = (result as { success: boolean; emotional_delivery: EmotionalDelivery }).emotional_delivery;
        }

        // Track for UI (exclude emotional delivery from tool_results)
        if (toolUse.name !== 'set_emotional_delivery') {
          toolExecutionResults.push({
            tool: toolUse.name,
            success: result.success,
            data: result.success ? result : undefined,
            error: result.success ? undefined : (result as { error: string }).error,
          });
        }

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
        system: enhancedSystemPrompt,
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

    return res.status(200).json({
      message: textContent?.text || '',
      tool_results: toolExecutionResults,
      emotional_delivery: emotionalDelivery,  // Phase C: Include emotional delivery
    });

  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      error: 'Internal server error',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}
