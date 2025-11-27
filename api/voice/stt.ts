// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text using OpenAI Whisper API
// Clean architecture: Whisper for transcription, Hume for TTS expression

import { VercelRequest, VercelResponse } from '@vercel/node';

interface STTResponse {
  text: string;
  confidence: number;
  duration_ms: number;
}

// Build multipart form data manually for reliable Node.js compatibility
function buildMultipartFormData(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string
): { body: Buffer; boundary: string } {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  const parts: Buffer[] = [];

  // File part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(audioBuffer);
  parts.push(Buffer.from('\r\n'));

  // Model part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `whisper-1\r\n`
  ));

  // Response format part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
    `verbose_json\r\n`
  ));

  // Final boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    boundary,
  };
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

    // Build multipart form data
    const { body, boundary } = buildMultipartFormData(
      audioBuffer,
      filename,
      cleanMimeType
    );

    console.log('Sending to Whisper API:', {
      filename,
      contentType: cleanMimeType,
      bodySize: body.length,
    });

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
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
        // Log the actual error for debugging
        console.error('Whisper 400 error details:', errorText);
        return res.status(400).json({
          error: 'Invalid audio',
          details: 'The audio format may not be supported. Try recording again.',
          debug: errorText
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
