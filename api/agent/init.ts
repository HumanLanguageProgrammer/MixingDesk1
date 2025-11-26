// api/agent/init.ts
// Vercel Serverless Function - Loads Agent OS from Supabase
// Using Node.js runtime with proper VercelRequest/VercelResponse signature

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing Supabase credentials'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agent_name } = req.body;

    if (!agent_name) {
      return res.status(400).json({ error: 'agent_name is required' });
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
      return res.status(404).json({
        error: 'Failed to load Agent OS',
        details: error.message,
        hint: error.hint || 'Check if agent_os table exists and has data'
      });
    }

    if (!agentOS) {
      console.error('No Agent OS found for:', agent_name);
      return res.status(404).json({
        error: 'Agent OS not found',
        details: `No active agent with name "${agent_name}"`,
        hint: 'Check Supabase agent_os table'
      });
    }

    console.log('Agent OS loaded successfully:', agentOS.agent_name);

    // Return the Agent OS
    return res.status(200).json({ agentOS });

  } catch (error) {
    console.error('Init error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}
