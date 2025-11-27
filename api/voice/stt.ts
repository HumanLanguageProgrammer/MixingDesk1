// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text using OpenAI Whisper API
// Clean architecture: Whisper for transcription, Hume for TTS expression

import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { File } from 'buffer';

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
    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0];
    const extension = extensionMap[mimeType || 'audio/webm'] || extensionMap[cleanMimeType] || 'webm';
    const filename = `audio.${extension}`;

    console.log('Sending to Whisper API:', {
      filename,
      contentType: cleanMimeType,
      bufferSize: audioBuffer.length,
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Create a File object using Node.js native File class
    const file = new File([audioBuffer], filename, { type: cleanMimeType });

    // Call Whisper API using the official SDK
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    const processingTime = Date.now() - startTime;

    console.log('Whisper transcription complete:', {
      text: transcription.text?.substring(0, 50) + '...',
      processingTime: `${processingTime}ms`
    });

    // Build response
    const response: STTResponse = {
      text: transcription.text || '',
      confidence: 0.95, // Whisper doesn't provide confidence scores, using high default
      duration_ms: processingTime,
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

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return res.status(500).json({
          error: 'Authentication failed',
          details: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY configuration.'
        });
      }
      if (error.status === 400) {
        return res.status(400).json({
          error: 'Invalid audio',
          details: 'The audio format may not be supported. Try recording again.',
          debug: error.message
        });
      }
      return res.status(500).json({
        error: 'Transcription failed',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
