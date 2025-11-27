// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text using OpenAI Whisper API
// Clean architecture: Whisper for transcription, Hume for TTS expression

import { VercelRequest, VercelResponse } from '@vercel/node';

interface STTResponse {
  text: string;
  confidence: number;
  duration_ms: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('Missing OPENAI_API_KEY');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'OPENAI_API_KEY not configured. Please add your OpenAI API key to enable voice transcription.'
    });
  }

  try {
    const { audio, mimeType } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');
    const startTime = Date.now();

    console.log('STT request received:', {
      size: audioBuffer.length,
      mimeType: mimeType || 'audio/webm',
    });

    if (audioBuffer.length < 1000) {
      return res.status(400).json({
        error: 'Audio too short',
        details: 'Please record for at least 1 second'
      });
    }

    // Determine file extension from mime type
    const extensionMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    };
    const extension = extensionMap[mimeType || 'audio/webm'] || 'webm';

    // Create FormData for OpenAI Whisper API
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', whisperResponse.status, errorText);

      // Provide helpful error messages
      if (whisperResponse.status === 401) {
        return res.status(500).json({
          error: 'Authentication failed',
          details: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY configuration.'
        });
      }

      if (whisperResponse.status === 400) {
        return res.status(400).json({
          error: 'Invalid audio',
          details: 'The audio format may not be supported. Try recording again.'
        });
      }

      return res.status(500).json({
        error: 'Transcription failed',
        details: errorText
      });
    }

    const whisperResult = await whisperResponse.json();
    const processingTime = Date.now() - startTime;

    console.log('Whisper transcription complete:', {
      text: whisperResult.text?.substring(0, 50) + '...',
      duration: whisperResult.duration,
      processingTime: `${processingTime}ms`
    });

    // Build response
    const response: STTResponse = {
      text: whisperResult.text || '',
      confidence: 0.95, // Whisper doesn't provide confidence scores, using high default
      duration_ms: Math.round((whisperResult.duration || 0) * 1000),
    };

    // Return empty text handling
    if (!response.text.trim()) {
      return res.status(200).json({
        ...response,
        text: '',
        confidence: 0,
      });
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('STT error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
