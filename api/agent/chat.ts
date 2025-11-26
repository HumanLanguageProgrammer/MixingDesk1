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
  runtime: 'nodejs',
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
    // Validate environment variables
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!anthropicKey) {
      console.error('Missing ANTHROPIC_API_KEY');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'ANTHROPIC_API_KEY not configured'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Supabase credentials not configured'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('Processing chat request with', messages.length, 'messages');

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
