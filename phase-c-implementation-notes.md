# Phase C Implementation Notes
## Lessons Learned from Prototype Development
### November 27-28, 2025

---

## Overview

These notes capture critical implementation learnings from the Phase C prototype. They should be incorporated into future implementations to avoid debugging rabbit holes.

---

## Key Architectural Changes from Spec

### 1. Speech-to-Text: Full Hume AI (Updated Nov 28)

**We now use Hume AI for BOTH STT and TTS - achieving full Hume voice integration:**

```yaml
STT: Hume AI Expression Measurement API (Batch)
  - Endpoint: client.expressionMeasurement.batch.startInferenceJobFromLocalFile()
  - Models: prosody + language (with transcription enabled)
  - Provides: Transcription + 48 prosody emotions + 53 language emotions
  - Polling: Job-based async with ~500ms poll interval
  - Typical latency: 3-8 seconds for short recordings

TTS: Hume AI Octave
  - Endpoint: POST https://api.hume.ai/v0/tts/file
  - Provides emotional/expressive voice output
  - Custom voice selection supported
```

**Evolution:**
1. Initial spec: Hume for both STT and TTS
2. First implementation (Nov 27): OpenAI Whisper for STT (simpler, faster)
3. Final implementation (Nov 28): Full Hume for both (enables emotion detection)

**Why Full Hume:**
- Emotion detection from visitor's voice (prosody model)
- Emotion analysis of transcribed text (language model)
- Single provider for voice stack (simpler architecture)
- Enables Claude to respond with emotional awareness

---

## Critical Implementation Details

### 2. MediaRecorder: DO NOT Use Timeslice

**Problem:** Using `mediaRecorder.start(100)` (with timeslice) causes the WebM header to be in a separate chunk, which can get lost during reassembly.

**Symptom:** Valid WebM magic bytes (`1a45dfa3`) missing from audio blob. OpenAI returns "Invalid file format" even though webm is supported.

```typescript
// ❌ WRONG - causes header loss
mediaRecorder.start(100);  // Timeslice splits header from data

// ✅ CORRECT - complete file with header
mediaRecorder.start();     // No timeslice, one complete file
```

**The Fix:**
- Remove timeslice parameter entirely
- `ondataavailable` fires once when `stop()` is called
- Single blob contains complete, valid WebM file

---

### 3. Vercel Node.js Compatibility: Use toFile Helper

**Problem:** Node.js native `File` class (`import { File } from 'buffer'`) requires Node.js v20+, which may not be available in Vercel serverless.

**Symptom:** 400 error from Whisper API, even with seemingly valid audio.

```typescript
// ❌ WRONG - requires Node.js v20+
import { File } from 'buffer';
const file = new File([audioBuffer], filename, { type: mimeType });

// ✅ CORRECT - works across Node.js versions
import OpenAI, { toFile } from 'openai';
const file = await toFile(audioBuffer, filename, { type: mimeType });
```

---

### 4. Hume TTS: Voice Selection Format

**Problem:** Voice must be specified inside the utterance object, not at the top level.

**Symptom:** 400 error: "Extra inputs are not permitted" at `body.voice`

```typescript
// ❌ WRONG - voice at top level
const requestBody = {
  utterances: [{ text: "Hello" }],
  voice: { id: voiceId },  // Error!
};

// ✅ CORRECT - voice inside utterance
const requestBody = {
  utterances: [{
    text: "Hello",
    voice: { id: voiceId },  // Correct!
  }],
  format: { type: 'mp3' },
};
```

**Endpoint:** `https://api.hume.ai/v0/tts/file`

---

### 5. UI: Click-to-Toggle (NOT Push-to-Talk)

**Problem:** Push-to-talk (hold button to record) was unintuitive for users who expected click-to-toggle behavior.

**Symptom:** Recordings were ~100-200ms (time between mousedown and mouseup), way too short for Whisper (minimum 0.1s of actual audio content).

```typescript
// ❌ Push-to-Talk - confusing UX
onMouseDown={startRecording}
onMouseUp={stopRecording}

// ✅ Click-to-Toggle - intuitive UX
onClick={() => isRecording ? stopRecording() : startRecording()}
```

**User Mental Model:**
1. Click to start recording (button turns red, shows timer)
2. Speak for as long as needed
3. Click again to stop and send

---

## Debugging Checklist

When voice features aren't working, check in order:

### STT Issues
```yaml
1. Check browser console for "Raw audio blob check":
   - Is isValidWebm: true? (magic bytes should be 1a45dfa3)
   - Is size reasonable? (should be 1KB+ for 1 second of audio)

2. Check recording duration:
   - Is it > 500ms? (Whisper needs > 0.1s of audio)
   - If duration is ~100ms, button behavior is wrong

3. Check Vercel logs for OpenAI error:
   - "Invalid file format" = WebM header missing (timeslice issue)
   - Auth errors = API key issue
```

### TTS Issues
```yaml
1. Check Vercel logs for Hume response:
   - 400 error = Check request body format
   - 401 error = API key issue
   - Voice errors = Check voice ID and placement in utterance

2. Check browser for audio playback:
   - Is blob URL created?
   - Are there CORS issues?
```

---

## Environment Variables

```bash
# Voice - Hume AI (BOTH STT and TTS)
HUME_API_KEY=...
HUME_VOICE_ID=63258ccf-...  # UUID format

# Agent - Anthropic Claude
ANTHROPIC_API_KEY=...

# Feature flag
VITE_VOICE_ENABLED=true
```

**Note:** As of Nov 28, we no longer need OPENAI_API_KEY for voice features.
The entire voice stack runs on Hume AI.

---

## Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │              MediaRecorder API                   │    │
│  │  - start() WITHOUT timeslice                     │    │
│  │  - Produces complete WebM with header            │    │
│  │  - Click-to-toggle button UX                     │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│   /api/voice/stt    │       │   /api/voice/tts    │
│                     │       │                     │
│  Hume Expression    │       │  Hume AI Octave     │
│  Measurement API    │       │  - /v0/tts/file     │
│  - prosody model    │       │  - voice in utterance│
│  - language model   │       │  - emotional delivery│
│  - transcription    │       │                     │
└─────────────────────┘       └─────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                    Hume AI API                           │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │ Expression          │   │ Octave TTS              │  │
│  │ Measurement (Batch) │   │ /v0/tts/file            │  │
│  │ - Transcription     │   │ - Expressive synthesis  │  │
│  │ - Prosody emotions  │   │ - Voice selection       │  │
│  │ - Language emotions │   │ - Emotion controls      │  │
│  └─────────────────────┘   └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                  /api/agent/chat                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Anthropic Claude with:                           │    │
│  │ - Emotional context from visitor's voice         │    │
│  │ - set_emotional_delivery tool                    │    │
│  │ - Agency to respond with appropriate emotion     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Code Snippets for Reference

### Working STT Endpoint (Key Parts) - Updated Nov 28

```typescript
// api/voice/stt.ts
import { HumeClient } from 'hume';

// Decode base64 audio from client
const audioBuffer = Buffer.from(audio, 'base64');

// Create file for Hume API
const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

// Initialize Hume client
const client = new HumeClient({ apiKey: humeApiKey });

// Start batch inference job with prosody + language models
const jobResponse = await client.expressionMeasurement.batch.startInferenceJobFromLocalFile({
  file: [audioFile],
  json: JSON.stringify({
    models: {
      prosody: {},  // 48 emotion dimensions from voice
      language: { granularity: 'passage' },  // Emotion from transcribed text
    },
    transcription: {
      language: 'en',
      identifySpeakers: false,
      confidenceThreshold: 0.5,
    },
  }),
});

// Poll for completion
const jobId = jobResponse.data?.jobId;
// ... poll until COMPLETED ...

// Get predictions (includes transcription + emotions)
const predictions = await client.expressionMeasurement.batch.getJobPredictions(jobId);
```

### Working TTS Endpoint (Key Parts)

```typescript
// api/voice/tts.ts
const utterance = {
  text: text,
  description: `Speak with a ${tone} tone`,
};

// Voice INSIDE utterance
if (humeVoiceId) {
  utterance.voice = { id: humeVoiceId };
}

const requestBody = {
  utterances: [utterance],
  format: { type: 'mp3' },
};

const response = await fetch('https://api.hume.ai/v0/tts/file', {
  method: 'POST',
  headers: {
    'X-Hume-Api-Key': humeApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
});
```

### Working Audio Recorder (Key Parts)

```typescript
// useAudioRecorder.ts
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  // NO TIMESLICE - critical!
  mediaRecorder.start();
};
```

---

## Summary: Top 5 Gotchas

| # | Issue | Solution |
|---|-------|----------|
| 1 | WebM header missing | Don't use timeslice in MediaRecorder.start() |
| 2 | Node.js File class fails | Use standard Blob/File API in Vercel (Hume SDK compatible) |
| 3 | Hume voice not working | Put voice object inside utterance, not top level |
| 4 | Recording too short | Use click-to-toggle, not push-to-talk |
| 5 | Full Hume STT | Use Expression Measurement batch API with prosody + language + transcription |

---

## Workarounds Resolved (Nov 28)

The following temporary workarounds from Nov 27 have been resolved:

1. **Agent fallback removed** - Anthropic API billing fallback in chat.ts has been removed. The agent now uses the real API without fallback.

2. **Full Hume STT implemented** - OpenAI Whisper has been replaced with Hume Expression Measurement API, providing:
   - Transcription with confidence scores
   - Prosody emotion detection (48 dimensions)
   - Language emotion detection (53 dimensions)
   - Single provider for entire voice stack

---

## Next Steps for Production

1. **Remove debug logging** - Clean up console.log statements
2. ~~**Remove test fallback**~~ - ✅ DONE (Nov 28)
3. **Add error recovery** - Graceful fallback when TTS fails (show text only)
4. **Optimize latency** - Consider streaming TTS for faster response; current STT latency is 3-8 seconds due to batch job polling
5. ~~**Add emotion detection**~~ - ✅ DONE (Nov 28) - Full emotion detection now available from Hume STT
6. **Add thinking indicator** - Show "agent is thinking" UI during processing latency

---

*These notes should be reviewed and incorporated into the Phase C specification before the next implementation cycle.*
