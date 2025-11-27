// api/voice/tts.ts
// Vercel Serverless Function - Text-to-Speech with Emotional Delivery via Hume AI

import { VercelRequest, VercelResponse } from '@vercel/node';

interface EmotionalDelivery {
  tone: 'excited' | 'calm' | 'empathetic' | 'confident' | 'warm' | 'professional' | 'neutral';
  intensity: number;
  pacing: 'energetic' | 'measured' | 'gentle' | 'normal';
}

// Map our emotional delivery to Hume prosody parameters
function mapEmotionalDeliveryToHume(delivery?: EmotionalDelivery) {
  if (!delivery) {
    return {
      voice_settings: {},
    };
  }

  // Map our tone to Hume emotion parameters
  // Hume TTS uses emotion weights to influence voice expression
  const emotionMap: Record<string, Record<string, number>> = {
    excited: { Joy: 0.8, Excitement: 0.9, Interest: 0.7 },
    calm: { Calmness: 0.8, Serenity: 0.7, Contentment: 0.6 },
    empathetic: { Sympathy: 0.8, Sadness: 0.3, Compassion: 0.7 },
    confident: { Confidence: 0.9, Pride: 0.5, Determination: 0.7 },
    warm: { Joy: 0.5, Love: 0.4, Contentment: 0.6 },
    professional: { Calmness: 0.6, Confidence: 0.7, Interest: 0.5 },
    neutral: {},
  };

  // Map pacing to speech rate
  const pacingMap: Record<string, number> = {
    energetic: 1.15,
    measured: 0.9,
    gentle: 0.85,
    normal: 1.0,
  };

  const emotions = emotionMap[delivery.tone] || {};

  // Scale emotions by intensity
  const scaledEmotions: Record<string, number> = {};
  for (const [emotion, value] of Object.entries(emotions)) {
    scaledEmotions[emotion] = value * delivery.intensity;
  }

  return {
    voice_settings: {
      emotion_controls: scaledEmotions,
      speech_rate: pacingMap[delivery.pacing] || 1.0,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const humeApiKey = process.env.HUME_API_KEY;
  const humeVoiceId = process.env.HUME_VOICE_ID;

  if (!humeApiKey) {
    console.error('Missing HUME_API_KEY');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'HUME_API_KEY not configured'
    });
  }

  if (!humeVoiceId) {
    console.error('Missing HUME_VOICE_ID');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'HUME_VOICE_ID not configured'
    });
  }

  try {
    const { text, emotional_delivery } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Map emotional delivery to Hume parameters
    const humeParams = mapEmotionalDeliveryToHume(emotional_delivery);

    console.log('TTS request:', {
      text: text.substring(0, 50) + '...',
      emotional_delivery,
      humeParams
    });

    // Call Hume TTS API
    // Using the Octave TTS endpoint (newer API)
    const requestBody = {
      utterances: [
        {
          text: text,
          description: `Speak with a ${emotional_delivery?.tone || 'warm'} tone`,
        }
      ],
      format: {
        type: 'mp3',
      },
      // Use voice name instead of ID if available
      ...(humeVoiceId && { voice: { name: humeVoiceId } }),
    };

    console.log('Calling Hume TTS API:', {
      url: 'https://api.hume.ai/v0/tts/file',
      textLength: text.length,
      voice: humeVoiceId,
    });

    const humeResponse = await fetch('https://api.hume.ai/v0/tts/file', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': humeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Hume TTS response status:', humeResponse.status);

    if (!humeResponse.ok) {
      const errorText = await humeResponse.text();
      console.error('Hume TTS error:', humeResponse.status, errorText);

      // Fallback: return a simple response indicating TTS failed
      // The client can show text-only in this case
      return res.status(500).json({
        error: 'TTS processing failed',
        details: errorText,
        status: humeResponse.status,
        fallback: true
      });
    }

    // Check content type from Hume response
    const contentType = humeResponse.headers.get('content-type');

    if (contentType?.includes('audio')) {
      // Stream the audio response back to the client
      const audioBuffer = await humeResponse.arrayBuffer();

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.byteLength);

      return res.send(Buffer.from(audioBuffer));
    } else {
      // JSON response - might contain URL or other data
      const jsonResult = await humeResponse.json();

      if (jsonResult.audio_url) {
        // Fetch the audio from URL and stream it
        const audioResponse = await fetch(jsonResult.audio_url);
        const audioBuffer = await audioResponse.arrayBuffer();

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.byteLength);

        return res.send(Buffer.from(audioBuffer));
      }

      // Return JSON result as fallback
      return res.status(200).json(jsonResult);
    }

  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
