// api/agent/init.ts
// Vercel Serverless Function - Loads Agent OS from Supabase

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'nodejs', // Using Node.js runtime for better compatibility
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing Supabase credentials'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agent_name } = await request.json();

    if (!agent_name) {
      return new Response(
        JSON.stringify({ error: 'agent_name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Loading Agent OS:', agent_name);

    // Fetch Agent OS from Supabase
    const { data: agentOS, error } = await supabase
      .from('agent_os')
      .select('*')
      .eq('agent_name', agent_name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to load Agent OS',
          details: error.message,
          hint: error.hint || 'Check if agent_os table exists and has data'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!agentOS) {
      console.error('No Agent OS found for:', agent_name);
      return new Response(
        JSON.stringify({
          error: 'Agent OS not found',
          details: `No active agent with name "${agent_name}"`,
          hint: 'Check Supabase agent_os table'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Agent OS loaded successfully:', agentOS.agent_name);

    // Return the Agent OS
    return new Response(JSON.stringify({ agentOS }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Init error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
