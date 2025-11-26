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
