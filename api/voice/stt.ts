// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text with Emotion Detection via Hume AI

import { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';

// Disable body parsing - we handle multipart form data manually
export const config = {
  api: {
    bodyParser: false,
  },
};

interface EmotionScore {
  name: string;
  score: number;
}

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

// Helper: Parse Hume response into our STTResponse format
function parseHumeSTTResponse(humeResult: any): ParsedSTTResponse {
  // Extract transcription from Hume's response structure
  const predictions = humeResult?.results?.predictions || humeResult?.predictions || [];
  const firstPrediction = predictions[0] || {};

  // Get transcription text
  const text = firstPrediction.text ||
               humeResult?.results?.[0]?.predictions?.[0]?.text ||
               '';

  // Extract emotions
  const rawEmotions: Record<string, number> = {};
  const emotionPredictions: EmotionScore[] =
    firstPrediction.emotions ||
    humeResult?.results?.[0]?.predictions?.[0]?.emotions ||
    [];

  for (const em of emotionPredictions) {
    if (em.name && typeof em.score === 'number') {
      rawEmotions[em.name] = em.score;
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

  let pace: 'slow' | 'normal' | 'fast' = 'normal';
  if (excitement > 0.6 || anxiety > 0.5) pace = 'fast';
  else if (calmness > 0.6) pace = 'slow';

  let tone: 'hesitant' | 'neutral' | 'engaged' | 'excited' = 'neutral';
  if (excitement > 0.7) tone = 'excited';
  else if (primary.score > 0.6) tone = 'engaged';
  else if (anxiety > 0.5) tone = 'hesitant';

  return {
    text,
    emotions: { primary, secondary, raw: rawEmotions },
    prosody: { pace, tone, volume: 'normal' },
    confidence: firstPrediction.confidence || 0.9,
    duration_ms: humeResult?.duration_ms || 0,
  };
}

// Parse form data
function parseForm(req: VercelRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB max
    });

    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const humeApiKey = process.env.HUME_API_KEY;

  if (!humeApiKey) {
    console.error('Missing HUME_API_KEY');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'HUME_API_KEY not configured'
    });
  }

  try {
    // Parse multipart form data
    const { files } = await parseForm(req);

    const audioFile = files.audio as File | File[];
    const file = Array.isArray(audioFile) ? audioFile[0] : audioFile;

    if (!file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Read the audio file
    const audioBuffer = fs.readFileSync(file.filepath);
    const audioBlob = new Blob([audioBuffer], { type: file.mimetype || 'audio/webm' });

    // Create form data for Hume
    const humeFormData = new FormData();
    humeFormData.append('file', audioBlob, file.originalFilename || 'audio.webm');

    // Configure Hume to analyze prosody and get transcription
    humeFormData.append('models', JSON.stringify({
      prosody: {},
    }));

    // Call Hume batch API for speech analysis
    const humeResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': humeApiKey,
      },
      body: humeFormData,
    });

    if (!humeResponse.ok) {
      const errorText = await humeResponse.text();
      console.error('Hume STT error:', errorText);
      return res.status(500).json({
        error: 'STT processing failed',
        details: errorText
      });
    }

    const jobResult = await humeResponse.json();

    // For batch jobs, we get a job_id and need to poll for results
    // In production, you'd implement proper polling or use webhooks
    // For now, we'll use a simplified approach assuming quick processing
    const jobId = jobResult.job_id;

    if (jobId) {
      // Poll for job completion (simplified - in production use webhooks)
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const statusResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
          headers: {
            'X-Hume-Api-Key': humeApiKey,
          },
        });

        if (!statusResponse.ok) {
          attempts++;
          continue;
        }

        const statusResult = await statusResponse.json();

        if (statusResult.state?.status === 'COMPLETED') {
          // Get predictions
          const predictionsResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
            headers: {
              'X-Hume-Api-Key': humeApiKey,
            },
          });

          if (predictionsResponse.ok) {
            const predictions = await predictionsResponse.json();
            const sttResponse = parseHumeSTTResponse(predictions);

            // Clean up temp file
            fs.unlinkSync(file.filepath);

            return res.status(200).json(sttResponse);
          }
        } else if (statusResult.state?.status === 'FAILED') {
          fs.unlinkSync(file.filepath);
          return res.status(500).json({
            error: 'STT processing failed',
            details: 'Hume job failed'
          });
        }

        attempts++;
      }

      fs.unlinkSync(file.filepath);
      return res.status(500).json({
        error: 'STT processing timeout',
        details: 'Job did not complete in time'
      });
    }

    // If we got direct results (for simpler API calls)
    const sttResponse = parseHumeSTTResponse(jobResult);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json(sttResponse);

  } catch (error) {
    console.error('STT error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
