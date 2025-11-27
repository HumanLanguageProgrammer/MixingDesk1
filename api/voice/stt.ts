// api/voice/stt.ts
// Vercel Serverless Function for Speech-to-Text using OpenAI Whisper

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI, { toFile } from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audio, mimeType } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Validate OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    // Decode base64 audio to Buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    console.log('STT Request:', {
      mimeType,
      bufferSize: audioBuffer.length,
    });

    // Validate buffer size (minimum for valid audio)
    if (audioBuffer.length < 100) {
      return res.status(400).json({
        error: 'Audio data too small. Please record for longer.',
        details: `Received ${audioBuffer.length} bytes`
      });
    }

    // Determine file extension from mime type
    const extension = getExtensionFromMimeType(mimeType || 'audio/webm');
    const filename = `audio.${extension}`;

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Convert buffer to a File object using OpenAI's toFile helper
    const audioFile = await toFile(audioBuffer, filename, {
      type: mimeType || 'audio/webm',
    });

    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    console.log('Transcription successful:', {
      textLength: transcription.text?.length,
      preview: transcription.text?.substring(0, 50),
    });

    return res.status(200).json({
      text: transcription.text,
      success: true,
    });

  } catch (error) {
    console.error('STT error:', error);

    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      const status = error.status || 500;
      const message = error.message || 'OpenAI API error';

      // Check for specific error types
      if (message.includes('Invalid file format') || message.includes('audio')) {
        return res.status(400).json({
          error: 'The audio format may not be supported. Try recording again.',
          details: message,
        });
      }

      return res.status(status).json({
        error: message,
        details: `OpenAI error code: ${error.code}`,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  // Map common audio mime types to file extensions
  // OpenAI supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
  const mimeMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'mp4',
    'audio/m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
  };

  return mimeMap[mimeType] || 'webm';
}
