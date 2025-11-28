// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text using OpenAI Whisper API
// Clean architecture: Whisper for transcription, Hume for TTS expression

import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI, { toFile } from 'openai';

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

    // Debug: Log first 20 chars of received base64
    const base64Preview = typeof audio === 'string' ? audio.substring(0, 20) : 'not-a-string';

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');
    const startTime = Date.now();

    console.log('STT request received:', {
      size: audioBuffer.length,
      mimeType: mimeType || 'audio/webm',
      base64Preview: base64Preview,
      audioType: typeof audio,
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

    // Check if the buffer looks like a valid webm file (EBML header: 1A 45 DF A3)
    const magicBytes = audioBuffer.slice(0, 4).toString('hex');
    const isValidWebm = magicBytes === '1a45dfa3';

    console.log('Sending to Whisper API:', {
      filename,
      contentType: cleanMimeType,
      bufferSize: audioBuffer.length,
      magicBytes,
      isValidWebm,
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Create file using toFile with explicit Uint8Array conversion
    // This ensures proper binary handling across Node.js versions
    const file = await toFile(
      new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length),
      filename,
      { type: cleanMimeType }
    );

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
      console.error('OpenAI API Error details:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });

      if (error.status === 401) {
        return res.status(500).json({
          error: 'Authentication failed',
          details: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY configuration.'
        });
      }
      if (error.status === 400) {
        return res.status(400).json({
          error: 'Invalid audio',
          details: `OpenAI error: ${error.message}`,
          openai_code: error.code,
          openai_type: error.type,
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
