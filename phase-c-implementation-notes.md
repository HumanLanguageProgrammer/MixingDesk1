# Phase C Implementation Notes
## Lessons Learned from Prototype Development
### November 27-28, 2025

---

## Overview

These notes capture critical implementation learnings from the Phase C prototype. They should be incorporated into future implementations to avoid debugging rabbit holes.

---

## Key Architectural Changes from Spec

### 1. Speech-to-Text: OpenAI Whisper (Final Decision Nov 28)

**Architecture: Use the right tool for each job**

```yaml
STT: OpenAI Whisper API
  - Endpoint: openai.audio.transcriptions.create()
  - Model: whisper-1
  - Provides: Fast, reliable transcription
  - Latency: ~1-2 seconds
  - Simplicity: Simple REST API, battle-tested

TTS: Hume AI Octave
  - Endpoint: POST https://api.hume.ai/v0/tts/file
  - Provides: Emotional/expressive voice output
  - Custom voice selection supported
```

**Evolution:**
1. Initial spec: Hume for both STT and TTS
2. Nov 27: OpenAI Whisper for STT (simpler, faster) ✅
3. Nov 28: Attempted full Hume for STT (emotion detection)
4. Nov 28: Reverted to Whisper - Hume Expression Measurement API not designed for production STT

**Why Whisper + Hume TTS:**
- Whisper: Designed for transcription, fast, reliable, simple API
- Hume Expression Measurement: Designed for emotion analysis, not real-time STT
- Using tools for their intended purpose = ninja mode
- Hume TTS still provides emotional expression for output

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
# STT - OpenAI Whisper
OPENAI_API_KEY=sk-...

# TTS - Hume AI
HUME_API_KEY=...
HUME_VOICE_ID=63258ccf-...  # UUID format

# Agent - Anthropic Claude
ANTHROPIC_API_KEY=...

# Feature flag
VITE_VOICE_ENABLED=true
```

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
│  OpenAI Whisper     │       │  Hume AI Octave     │
│  - toFile() helper  │       │  - /v0/tts/file     │
│  - whisper-1 model  │       │  - voice in utterance│
│  - Fast & reliable  │       │  - emotional delivery│
└─────────────────────┘       └─────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│  OpenAI API         │       │  Hume AI API        │
│  - Transcription    │       │  - TTS synthesis    │
│  - ~1-2s latency    │       │  - Emotional voice  │
└─────────────────────┘       └─────────────────────┘
```

---

## Code Snippets for Reference

### Working STT Endpoint (Key Parts)

```typescript
// api/voice/stt.ts
import OpenAI, { toFile } from 'openai';

// Decode base64 audio from client
const audioBuffer = Buffer.from(audio, 'base64');

// Use toFile helper (NOT native File class)
const file = await toFile(
  new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length),
  'audio.webm',
  { type: 'audio/webm' }
);

// Call Whisper
const transcription = await openai.audio.transcriptions.create({
  file,
  model: 'whisper-1',
});
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
| 2 | Node.js File class fails | Use OpenAI's toFile() helper |
| 3 | Hume voice not working | Put voice object inside utterance, not top level |
| 4 | Recording too short | Use click-to-toggle, not push-to-talk |
| 5 | Wrong tool for job | Use Whisper for STT (fast), Hume for TTS (expressive) |

---

## Lessons Learned (Nov 28)

1. **Agent fallback removed** - Anthropic API billing fallback in chat.ts has been removed. The agent now uses the real API without fallback.

2. **Use tools for their intended purpose:**
   - Hume Expression Measurement API = emotion analysis (not production STT)
   - OpenAI Whisper = fast, reliable transcription
   - Hume Octave = expressive TTS
   - Fighting the tool = "tank in a swamp"
   - Using the right tool = "ninja mode"

---

## Next Steps for Production

1. **Remove debug logging** - Clean up console.log statements
2. ~~**Remove test fallback**~~ - ✅ DONE (Nov 28)
3. **Add error recovery** - Graceful fallback when TTS fails (show text only)
4. **Add thinking indicator** - Show "agent is thinking" UI during processing latency
5. **Consider Deepgram** - For even lower latency STT in production build

---

*These notes should be reviewed and incorporated into the Phase C specification before the next implementation cycle.*
