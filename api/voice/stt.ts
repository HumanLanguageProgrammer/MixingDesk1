// api/voice/stt.ts
// Vercel Serverless Function - Speech-to-Text using Hume AI Expression Measurement API
// Provides transcription + emotion detection from voice

import { VercelRequest, VercelResponse } from '@vercel/node';
import { HumeClient } from 'hume';

interface EmotionScore {
  name: string;
  score: number;
}

interface STTResponse {
  text: string;
  confidence: number;
  duration_ms: number;
  emotions?: {
    primary: { emotion: string; score: number };
    secondary?: { emotion: string; score: number };
    raw: Record<string, number>;
  };
  prosody?: {
    pace: 'slow' | 'normal' | 'fast';
    tone: 'hesitant' | 'neutral' | 'engaged' | 'excited';
    volume: 'quiet' | 'normal' | 'loud';
  };
}

// Helper: Extract top emotions from Hume predictions
function extractTopEmotions(emotions: EmotionScore[]): {
  primary: { emotion: string; score: number };
  secondary?: { emotion: string; score: number };
  raw: Record<string, number>;
} {
  // Sort by score descending
  const sorted = [...emotions].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Build raw map
  const raw: Record<string, number> = {};
  emotions.forEach(e => {
    if (e.name && e.score !== undefined) {
      raw[e.name] = e.score;
    }
  });

  return {
    primary: {
      emotion: sorted[0]?.name || 'neutral',
      score: sorted[0]?.score || 0,
    },
    secondary: sorted[1] ? {
      emotion: sorted[1].name || 'neutral',
      score: sorted[1].score || 0,
    } : undefined,
    raw,
  };
}

// Helper: Infer prosody characteristics from emotion profile
function inferProsody(emotions: Record<string, number>): {
  pace: 'slow' | 'normal' | 'fast';
  tone: 'hesitant' | 'neutral' | 'engaged' | 'excited';
  volume: 'quiet' | 'normal' | 'loud';
} {
  // Hume provides 48 prosody dimensions - map key ones to our simplified model
  const excitement = emotions['Excitement'] || emotions['Joy'] || 0;
  const calmness = emotions['Calmness'] || emotions['Contentment'] || 0;
  const anxiety = emotions['Anxiety'] || emotions['Fear'] || 0;
  const sadness = emotions['Sadness'] || emotions['Disappointment'] || 0;
  const interest = emotions['Interest'] || emotions['Curiosity'] || 0;
  const confusion = emotions['Confusion'] || emotions['Doubt'] || 0;

  // Infer pace
  let pace: 'slow' | 'normal' | 'fast' = 'normal';
  if (excitement > 0.5 || anxiety > 0.5) {
    pace = 'fast';
  } else if (calmness > 0.5 || sadness > 0.4) {
    pace = 'slow';
  }

  // Infer tone
  let tone: 'hesitant' | 'neutral' | 'engaged' | 'excited' = 'neutral';
  if (excitement > 0.5) {
    tone = 'excited';
  } else if (interest > 0.4 || (excitement > 0.3 && excitement <= 0.5)) {
    tone = 'engaged';
  } else if (anxiety > 0.4 || confusion > 0.4) {
    tone = 'hesitant';
  }

  // Infer volume (harder to determine from emotion, default to normal)
  let volume: 'quiet' | 'normal' | 'loud' = 'normal';
  if (excitement > 0.6 || anxiety > 0.6) {
    volume = 'loud';
  } else if (sadness > 0.5 || calmness > 0.6) {
    volume = 'quiet';
  }

  return { pace, tone, volume };
}

// Helper: Poll for job completion with timeout
async function pollForJobCompletion(
  client: HumeClient,
  jobId: string,
  maxWaitMs: number = 15000,
  pollIntervalMs: number = 500
): Promise<'COMPLETED' | 'FAILED' | 'TIMEOUT'> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const jobDetails = await client.expressionMeasurement.batch.getJobDetails(jobId);
    // SDK returns UnionJob which has state.status
    const state = (jobDetails as { state?: { status?: string } })?.state?.status;

    console.log('Job status:', state, 'elapsed:', Date.now() - startTime, 'ms');

    if (state === 'COMPLETED') {
      return 'COMPLETED';
    }
    if (state === 'FAILED') {
      return 'FAILED';
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return 'TIMEOUT';
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
      details: 'HUME_API_KEY not configured. Please add your Hume API key to enable voice transcription with emotion detection.'
    });
  }

  try {
    const { audio, mimeType } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const startTime = Date.now();

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');

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

    // Check WebM magic bytes
    const magicBytes = audioBuffer.slice(0, 4).toString('hex');
    const isValidWebm = magicBytes === '1a45dfa3';

    console.log('Audio validation:', {
      magicBytes,
      isValidWebm,
      bufferSize: audioBuffer.length,
    });

    // Initialize Hume client
    const client = new HumeClient({
      apiKey: humeApiKey,
    });

    // Determine file extension
    const extensionMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/ogg': 'ogg',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    };
    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0];
    const extension = extensionMap[mimeType || 'audio/webm'] || extensionMap[cleanMimeType] || 'webm';

    // Create a file-like object for the Hume API
    // The SDK expects a ReadStream or File object
    const audioBlob = new Blob([audioBuffer], { type: cleanMimeType });
    const audioFile = new File([audioBlob], `recording.${extension}`, { type: cleanMimeType });

    console.log('Starting Hume batch inference job...');

    // Start inference job with prosody and language models
    // Enable transcription for language analysis
    const jobResponse = await client.expressionMeasurement.batch.startInferenceJobFromLocalFile({
      file: [audioFile],
      json: {
        models: {
          prosody: {},  // Speech prosody (48 emotion dimensions from voice)
          language: {
            granularity: 'passage',  // Get overall emotion for the whole message
          },
        },
        transcription: {
          language: 'en',  // English
          identifySpeakers: false,
          confidenceThreshold: 0.5,
        },
      },
    });

    // SDK returns JobId object with jobId property
    const jobId = (jobResponse as { jobId?: string })?.jobId;
    if (!jobId) {
      throw new Error('Failed to get job ID from Hume API');
    }

    console.log('Job started:', jobId);

    // Poll for completion
    const completionStatus = await pollForJobCompletion(client, jobId);

    if (completionStatus === 'TIMEOUT') {
      console.error('Hume job timed out');
      return res.status(504).json({
        error: 'Processing timeout',
        details: 'Audio analysis took too long. Please try with a shorter recording.',
      });
    }

    if (completionStatus === 'FAILED') {
      console.error('Hume job failed');
      return res.status(500).json({
        error: 'Processing failed',
        details: 'Audio analysis failed. Please try again.',
      });
    }

    // Get predictions - SDK returns array directly
    const results = await client.expressionMeasurement.batch.getJobPredictions(jobId);

    console.log('Predictions received:', JSON.stringify(results, null, 2).substring(0, 500));

    // Extract transcription and emotions from results
    let transcribedText = '';
    let prosodyEmotions: EmotionScore[] = [];
    let languageEmotions: EmotionScore[] = [];
    let transcriptionConfidence = 0.9; // Default confidence

    // Process prediction results (results is UnionPredictResult[])
    if (results && Array.isArray(results) && results.length > 0) {
      for (const result of results) {
        // Check if this is a source predict result with results property
        const sourceResult = result as { results?: { predictions?: unknown[] } };
        if (sourceResult.results?.predictions) {
          for (const prediction of sourceResult.results.predictions) {
            const pred = prediction as {
              prosody?: { predictions?: Array<{ emotions?: Array<{ name?: string; score?: number }> }> };
              language?: { predictions?: Array<{ text?: string; emotions?: Array<{ name?: string; score?: number }> }> };
              transcription?: { confidence?: number };
            };

            // Handle prosody
            if (pred.prosody?.predictions) {
              for (const prosodyPred of pred.prosody.predictions) {
                if (prosodyPred.emotions) {
                  prosodyEmotions = prosodyPred.emotions.map((e) => ({
                    name: e.name || '',
                    score: e.score || 0,
                  }));
                }
              }
            }

            // Handle language (includes transcription)
            if (pred.language?.predictions) {
              for (const langPred of pred.language.predictions) {
                // Get transcribed text
                if (langPred.text) {
                  transcribedText += (transcribedText ? ' ' : '') + langPred.text;
                }
                // Get language emotions
                if (langPred.emotions) {
                  languageEmotions = langPred.emotions.map((e) => ({
                    name: e.name || '',
                    score: e.score || 0,
                  }));
                }
              }
            }

            // Get transcription metadata if available
            if (pred.transcription?.confidence !== undefined) {
              transcriptionConfidence = pred.transcription.confidence;
            }
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;

    console.log('Hume STT complete:', {
      text: transcribedText.substring(0, 50) + (transcribedText.length > 50 ? '...' : ''),
      processingTime: `${processingTime}ms`,
      prosodyEmotionCount: prosodyEmotions.length,
      languageEmotionCount: languageEmotions.length,
    });

    // Combine prosody and language emotions (prefer prosody for voice-based emotion)
    const primaryEmotions = prosodyEmotions.length > 0 ? prosodyEmotions : languageEmotions;

    // Build response
    const response: STTResponse = {
      text: transcribedText.trim() || '',
      confidence: transcriptionConfidence,
      duration_ms: processingTime,
    };

    // Add emotion analysis if available
    if (primaryEmotions.length > 0) {
      const emotionAnalysis = extractTopEmotions(primaryEmotions);
      response.emotions = emotionAnalysis;
      response.prosody = inferProsody(emotionAnalysis.raw);
    }

    // Handle empty transcription
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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific Hume API errors
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return res.status(500).json({
        error: 'Authentication failed',
        details: 'Invalid Hume API key. Please check your HUME_API_KEY configuration.'
      });
    }

    if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
      return res.status(429).json({
        error: 'Rate limited',
        details: 'Too many requests. Please wait a moment and try again.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: errorMessage
    });
  }
}
