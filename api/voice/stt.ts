// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text with Emotion Detection via Hume AI
// Simplified version using base64 encoding for Vercel compatibility

import { VercelRequest, VercelResponse } from '@vercel/node';

interface ParsedSTTResponse {
  text: string;
  emotions: {
    primary: { emotion: string; score: number };
    secondary?: { emotion: string; score: number };
    raw: Record<string, number>;
  };
  prosody: {
    pace: 'slow' | 'normal' | 'fast';
    tone: 'hesitant' | 'neutral' | 'engaged' | 'excited';
    volume: 'quiet' | 'normal' | 'loud';
  };
  confidence: number;
  duration_ms: number;
}

// Helper: Parse Hume prosody response
function parseHumeResponse(humeResult: any): Partial<ParsedSTTResponse> {
  try {
    // Navigate Hume's response structure
    const results = humeResult?.[0]?.results?.predictions?.[0]?.models?.prosody?.grouped_predictions?.[0]?.predictions || [];

    const rawEmotions: Record<string, number> = {};

    for (const prediction of results) {
      if (prediction.emotions) {
        for (const em of prediction.emotions) {
          if (em.name && typeof em.score === 'number') {
            // Average scores if we see the same emotion multiple times
            if (rawEmotions[em.name]) {
              rawEmotions[em.name] = (rawEmotions[em.name] + em.score) / 2;
            } else {
              rawEmotions[em.name] = em.score;
            }
          }
        }
      }
    }

    // Find primary and secondary emotions
    const sortedEmotions = Object.entries(rawEmotions)
      .sort(([, a], [, b]) => b - a);

    const primary = sortedEmotions[0]
      ? { emotion: sortedEmotions[0][0], score: sortedEmotions[0][1] }
      : { emotion: 'neutral', score: 0.5 };

    const secondary = sortedEmotions[1]
      ? { emotion: sortedEmotions[1][0], score: sortedEmotions[1][1] }
      : undefined;

    // Derive prosody from emotion scores
    const excitement = rawEmotions['Excitement'] || rawEmotions['excitement'] || 0;
    const anxiety = rawEmotions['Anxiety'] || rawEmotions['anxiety'] || 0;
    const calmness = rawEmotions['Calmness'] || rawEmotions['calmness'] || 0;
    const interest = rawEmotions['Interest'] || rawEmotions['interest'] || 0;

    let pace: 'slow' | 'normal' | 'fast' = 'normal';
    if (excitement > 0.4 || anxiety > 0.4) pace = 'fast';
    else if (calmness > 0.4) pace = 'slow';

    let tone: 'hesitant' | 'neutral' | 'engaged' | 'excited' = 'neutral';
    if (excitement > 0.5) tone = 'excited';
    else if (interest > 0.4 || primary.score > 0.4) tone = 'engaged';
    else if (anxiety > 0.4) tone = 'hesitant';

    return {
      emotions: { primary, secondary, raw: rawEmotions },
      prosody: { pace, tone, volume: 'normal' },
      confidence: 0.85,
    };
  } catch (e) {
    console.error('Error parsing Hume response:', e);
    return {};
  }
}

// Default response when emotion detection isn't available
function getDefaultEmotions(): Omit<ParsedSTTResponse, 'text' | 'duration_ms'> {
  return {
    emotions: {
      primary: { emotion: 'neutral', score: 0.5 },
      raw: { neutral: 0.5 },
    },
    prosody: {
      pace: 'normal',
      tone: 'neutral',
      volume: 'normal',
    },
    confidence: 0.7,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const humeApiKey = process.env.HUME_API_KEY;

  try {
    const { audio, mimeType } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');

    console.log('Received audio:', {
      size: audioBuffer.length,
      mimeType: mimeType || 'audio/webm',
    });

    if (audioBuffer.length < 1000) {
      return res.status(400).json({
        error: 'Audio too short',
        details: 'Please record for at least 1 second'
      });
    }

    // For now, we'll use a simple approach:
    // 1. If Hume API is configured, try to get emotion analysis
    // 2. For transcription, we'll need the text from the client or use a separate service

    // Note: Hume's batch API requires file upload and polling which doesn't work well
    // on Vercel serverless. For production, consider using:
    // - Hume's WebSocket-based EVI for real-time
    // - A transcription service like Whisper/Deepgram + Hume for emotions
    // - Or pre-process on the client side

    let emotionData = getDefaultEmotions();

    if (humeApiKey) {
      try {
        // Try to analyze emotions via Hume's prosody model
        // Using the inference endpoint which is faster than batch
        const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');
        formData.append('models', JSON.stringify({ prosody: {} }));

        const humeResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
          method: 'POST',
          headers: {
            'X-Hume-Api-Key': humeApiKey,
          },
          body: formData,
        });

        if (humeResponse.ok) {
          const jobResult = await humeResponse.json();
          const jobId = jobResult.job_id;

          if (jobId) {
            // Quick poll (max 5 seconds for serverless)
            for (let i = 0; i < 5; i++) {
              await new Promise(r => setTimeout(r, 1000));

              const statusRes = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
                headers: { 'X-Hume-Api-Key': humeApiKey },
              });

              if (statusRes.ok) {
                const predictions = await statusRes.json();
                const parsed = parseHumeResponse(predictions);
                if (parsed.emotions) {
                  emotionData = { ...emotionData, ...parsed };
                }
                break;
              }
            }
          }
        }
      } catch (humeError) {
        console.error('Hume emotion analysis error:', humeError);
        // Continue with default emotions
      }
    }

    // For transcription, we need the text
    // In a full implementation, you'd use Whisper, Deepgram, or AssemblyAI
    // For now, return a placeholder that indicates voice was received
    const response: ParsedSTTResponse = {
      text: '[Voice message received - transcription pending]',
      ...emotionData,
      duration_ms: Math.round(audioBuffer.length / 16), // Rough estimate
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('STT error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
