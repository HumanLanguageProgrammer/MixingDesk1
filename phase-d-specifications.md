# PHASE D SPECIFICATIONS: Routing & Visit Lifecycle
## Operation Basecamp - App Architecture Layer
### Proving Multi-View Navigation and State Persistence
#### November 27, 2025

---

## Document Status

```yaml
Version: 1.0
Created: November 27, 2025
Status: READY FOR IMPLEMENTATION

Phase D Focus:
  Muscle: App switching, state passing, persistent visits
  NOT: Production architecture, polished UX, agent sophistication
  
Darkspots Being Eliminated:
  - Can we route between views?
  - Can we pass state via URL?
  - Can we persist visit records?
  - Can an agent trigger navigation?
```

---

## Mission

**Prove that we can orchestrate a multi-view application with persistent state across transitions.**

```yaml
What We're Proving:
  1. React Router integration (view switching)
  2. URL parameter passing (visit ID)
  3. Supabase CRUD for visits (persistence)
  4. Agent-triggered navigation (tool → route change)
  5. State continuity across views (notes flow through)

What We're NOT Building:
  - Production-ready CIOS
  - Sophisticated check-in interviews
  - Polished UI/UX
  - Complex visit analytics
  
Muscle Focus:
  "Can we switch apps and carry state?"
  If yes → darkspot eliminated → move on
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Single React App (Vite)                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Router                              │   │
│  │                                                              │   │
│  │   /checkin              /session/:visitId    /checkout/:id   │   │
│  │       │                        │                    │        │   │
│  │       ▼                        ▼                    ▼        │   │
│  │  ┌─────────┐            ┌───────────┐         ┌─────────┐   │   │
│  │  │ CheckIn │  ────────► │  Session  │ ──────► │CheckOut │   │   │
│  │  │  View   │  (create)  │   (VWS)   │ (end)   │  View   │   │   │
│  │  └─────────┘            └───────────┘         └─────────┘   │   │
│  │                               │                              │   │
│  │                               │ (existing Mixing Desk        │   │
│  │                               │  + visit awareness)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Supabase                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │    visits    │  │ library_items│  │      agent_os            │   │
│  │   (NEW!)     │  │  (existing)  │  │     (existing)           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## New Dependency

```bash
# Add React Router
npm install react-router-dom
```

No other new dependencies required.

---

## Database: visits Table

### Supabase SQL

```sql
-- Create visits table for visit lifecycle management
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Visitor info (optional for prototype)
  visitor_name TEXT,
  
  -- Visit status
  status TEXT DEFAULT 'checking_in' CHECK (status IN ('checking_in', 'engaged', 'checking_out', 'complete')),
  
  -- Notes accumulate throughout visit
  notes JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS (Row Level Security)
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Allow all operations for prototype (tighten for production)
CREATE POLICY "Allow all for prototype" ON visits
  FOR ALL USING (true) WITH CHECK (true);

-- Index for common queries
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_created ON visits(created_at DESC);
```

### Notes JSONB Structure

```typescript
// Each note in the notes array
interface VisitNote {
  timestamp: string;      // ISO string
  source: 'checkin' | 'agent' | 'vws' | 'checkout';
  content: string;
}

// Example notes array
[
  { timestamp: "2025-11-27T10:00:00Z", source: "checkin", content: "Interested in learning about AI" },
  { timestamp: "2025-11-27T10:05:00Z", source: "agent", content: "Discussed context window concepts" },
  { timestamp: "2025-11-27T10:15:00Z", source: "checkout", content: "Very helpful session" }
]
```

---

## TypeScript Types

```typescript
// src/types/index.ts - Add these types

// Visit status enum
export type VisitStatus = 'checking_in' | 'engaged' | 'checking_out' | 'complete';

// Note source enum
export type NoteSource = 'checkin' | 'agent' | 'vws' | 'checkout';

// Individual visit note
export interface VisitNote {
  timestamp: string;
  source: NoteSource;
  content: string;
}

// Visit record from Supabase
export interface Visit {
  id: string;
  created_at: string;
  updated_at: string;
  visitor_name: string | null;
  status: VisitStatus;
  notes: VisitNote[];
}

// Create visit input
export interface CreateVisitInput {
  visitor_name?: string;
  initial_note?: string;
}

// Update visit input
export interface UpdateVisitInput {
  visitor_name?: string;
  status?: VisitStatus;
  note?: {
    source: NoteSource;
    content: string;
  };
}
```

---

## Project Structure (Phase D Additions)

```
mixing-desk/
├── src/
│   ├── App.tsx                    # UPDATE: Add Router
│   ├── main.tsx                   # Unchanged
│   │
│   ├── components/
│   │   ├── MixingDesk.tsx         # UPDATE: Visit awareness
│   │   ├── CheckIn.tsx            # NEW: CIOS check-in view
│   │   ├── CheckOut.tsx           # NEW: CIOS check-out view
│   │   └── ... (existing)
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Unchanged
│   │   ├── visits.ts              # NEW: Visit CRUD operations
│   │   ├── agent.ts               # UPDATE: New tools
│   │   └── voice.ts               # Unchanged
│   │
│   ├── hooks/
│   │   ├── useVisit.ts            # NEW: Visit state management
│   │   └── ... (existing)
│   │
│   └── types/
│       └── index.ts               # UPDATE: Visit types
│
├── api/
│   └── agent/
│       └── chat.ts                # UPDATE: Visit-aware tools
│
└── package.json                   # UPDATE: Add react-router-dom
```

---

## Implementation: Router Setup

### App.tsx (Updated)

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CheckIn } from './components/CheckIn';
import { CheckOut } from './components/CheckOut';
import { MixingDesk } from './components/MixingDesk';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to check-in */}
        <Route path="/" element={<Navigate to="/checkin" replace />} />
        
        {/* CIOS: Check-In */}
        <Route path="/checkin" element={<CheckIn />} />
        
        {/* VWS: Session (existing Mixing Desk + visit awareness) */}
        <Route path="/session/:visitId" element={<MixingDesk />} />
        
        {/* CIOS: Check-Out */}
        <Route path="/checkout/:visitId" element={<CheckOut />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/checkin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Implementation: Visit Library

```typescript
// src/lib/visits.ts
import { supabase } from './supabase';
import type { Visit, CreateVisitInput, UpdateVisitInput, VisitNote } from '../types';

/**
 * Create a new visit record
 */
export async function createVisit(input: CreateVisitInput): Promise<Visit> {
  const notes: VisitNote[] = [];
  
  // Add initial note if provided
  if (input.initial_note) {
    notes.push({
      timestamp: new Date().toISOString(),
      source: 'checkin',
      content: input.initial_note,
    });
  }

  const { data, error } = await supabase
    .from('visits')
    .insert({
      visitor_name: input.visitor_name || null,
      status: 'checking_in',
      notes: notes,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create visit: ${error.message}`);
  return data as Visit;
}

/**
 * Get visit by ID
 */
export async function getVisit(visitId: string): Promise<Visit | null> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('id', visitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get visit: ${error.message}`);
  }
  
  return data as Visit;
}

/**
 * Update visit status
 */
export async function updateVisitStatus(
  visitId: string, 
  status: Visit['status']
): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', visitId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update visit: ${error.message}`);
  return data as Visit;
}

/**
 * Add note to visit
 */
export async function addVisitNote(
  visitId: string,
  source: VisitNote['source'],
  content: string
): Promise<Visit> {
  // First get current notes
  const visit = await getVisit(visitId);
  if (!visit) throw new Error('Visit not found');

  const newNote: VisitNote = {
    timestamp: new Date().toISOString(),
    source,
    content,
  };

  const updatedNotes = [...visit.notes, newNote];

  const { data, error } = await supabase
    .from('visits')
    .update({ 
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', visitId)
    .select()
    .single();

  if (error) throw new Error(`Failed to add note: ${error.message}`);
  return data as Visit;
}

/**
 * Get visit notes
 */
export async function getVisitNotes(visitId: string): Promise<VisitNote[]> {
  const visit = await getVisit(visitId);
  if (!visit) throw new Error('Visit not found');
  return visit.notes;
}
```

---

## Implementation: Check-In View

```tsx
// src/components/CheckIn.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVisit, updateVisitStatus } from '../lib/visits';

export function CheckIn() {
  const navigate = useNavigate();
  const [visitorName, setVisitorName] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create visit record
      const visit = await createVisit({
        visitor_name: visitorName || undefined,
        initial_note: initialNote || undefined,
      });

      // Update status to engaged
      await updateVisitStatus(visit.id, 'engaged');

      // Navigate to session with visit ID
      navigate(`/session/${visit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-gray-400 mt-2">Context Craft Learning Lab</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name (optional) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Your name (optional)
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Initial note */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              What brings you here today?
            </label>
            <textarea
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Tell us what you'd like to explore..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* Start button */}
          <button
            onClick={handleStartSession}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          CIOS Check-In • Operation Basecamp
        </p>
      </div>
    </div>
  );
}
```

---

## Implementation: Check-Out View

```tsx
// src/components/CheckOut.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVisit, addVisitNote, updateVisitStatus } from '../lib/visits';
import type { Visit } from '../types';

export function CheckOut() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [finalNote, setFinalNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load visit on mount
  useEffect(() => {
    async function loadVisit() {
      if (!visitId) {
        setError('No visit ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getVisit(visitId);
        if (!data) {
          setError('Visit not found');
        } else {
          setVisit(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visit');
      } finally {
        setIsLoading(false);
      }
    }

    loadVisit();
  }, [visitId]);

  const handleCompleteVisit = async () => {
    if (!visitId) return;
    
    setIsSaving(true);
    setError(null);

    try {
      // Add final note if provided
      if (finalNote.trim()) {
        await addVisitNote(visitId, 'checkout', finalNote.trim());
      }

      // Update status to complete
      await updateVisitStatus(visitId, 'complete');

      // Show completion or redirect
      alert('Visit complete! Thank you.');
      navigate('/checkin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete visit');
      setIsSaving(false);
    }
  };

  const handleStartNew = () => {
    navigate('/checkin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading visit...</p>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error || 'Visit not found'}</p>
          <button
            onClick={handleStartNew}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            Start New Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Session Complete</h1>
          {visit.visitor_name && (
            <p className="text-gray-400 mt-2">Thank you, {visit.visitor_name}!</p>
          )}
        </div>

        {/* Visit Notes Summary */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="font-medium text-gray-300">Session Notes</h2>
          {visit.notes.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes recorded</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {visit.notes.map((note, index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-500">
                    [{note.source}]
                  </span>{' '}
                  <span className="text-gray-300">{note.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Final note */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Any final thoughts?
          </label>
          <textarea
            value={finalNote}
            onChange={(e) => setFinalNote(e.target.value)}
            placeholder="Optional feedback or notes..."
            rows={2}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCompleteVisit}
            disabled={isSaving}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : 'Complete Visit'}
          </button>
          
          <button
            onClick={handleStartNew}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors"
          >
            Start New Visit
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          CIOS Check-Out • Visit: {visitId?.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}
```

---

## Implementation: MixingDesk Updates

### Key Changes

```tsx
// src/components/MixingDesk.tsx - Key updates

import { useParams, useNavigate } from 'react-router-dom';
import { useVisit } from '../hooks/useVisit';

export function MixingDesk() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  
  // Load visit context
  const { visit, isLoading: visitLoading, addNote } = useVisit(visitId);

  // ... existing state ...

  // Handle agent navigation request
  const handleAgentNavigation = (destination: string) => {
    if (destination === 'checkout' && visitId) {
      navigate(`/checkout/${visitId}`);
    }
  };

  // Pass to agent hook
  const { sendMessage, isLoading } = useAgent({
    visitId,
    visitNotes: visit?.notes || [],
    onNavigate: handleAgentNavigation,
    onAddNote: (content) => addNote('agent', content),
  });

  // ... rest of component ...
}
```

---

## Implementation: useVisit Hook

```typescript
// src/hooks/useVisit.ts
import { useState, useEffect, useCallback } from 'react';
import { getVisit, addVisitNote } from '../lib/visits';
import type { Visit, NoteSource } from '../types';

export function useVisit(visitId: string | undefined) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load visit on mount
  useEffect(() => {
    async function loadVisit() {
      if (!visitId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getVisit(visitId);
        setVisit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visit');
      } finally {
        setIsLoading(false);
      }
    }

    loadVisit();
  }, [visitId]);

  // Add note function
  const addNote = useCallback(async (source: NoteSource, content: string) => {
    if (!visitId) return;
    
    try {
      const updated = await addVisitNote(visitId, source, content);
      setVisit(updated);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }, [visitId]);

  return {
    visit,
    isLoading,
    error,
    addNote,
  };
}
```

---

## Agent Updates: New Tools

### Tool Definitions

```typescript
// Add to agent tools array

{
  name: 'read_visit_notes',
  description: 'Read all notes from the current visit. Use this to see what was discussed at check-in or earlier in the session.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
},

{
  name: 'add_visit_note',
  description: 'Add a note to the visit record. Use this to record important moments or key learnings from the conversation.',
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The note content to record',
      },
    },
    required: ['content'],
  },
},

{
  name: 'end_session',
  description: 'End the current session and take the visitor to check-out. Use this when the conversation has reached a natural conclusion.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Brief summary of what was accomplished in this session',
      },
    },
    required: [],
  },
},
```

### Tool Execution (Client-Side)

```typescript
// In useAgent.ts or wherever tools are executed

case 'read_visit_notes':
  return {
    success: true,
    data: visitNotes, // Passed from MixingDesk
  };

case 'add_visit_note':
  if (onAddNote) {
    onAddNote(toolInput.content);
  }
  return {
    success: true,
    data: { message: 'Note recorded' },
  };

case 'end_session':
  // Record summary as final agent note
  if (toolInput.summary && onAddNote) {
    onAddNote(`Session summary: ${toolInput.summary}`);
  }
  // Trigger navigation
  if (onNavigate) {
    onNavigate('checkout');
  }
  return {
    success: true,
    data: { message: 'Session ending, navigating to check-out' },
  };
```

---

## Agent OS Update (v2.1)

```sql
-- Update Testing Agent with visit awareness
UPDATE agent_os 
SET os_content = $$
# Testing Agent Operating System v2.1
## With Visit Lifecycle Awareness

## Identity

You are the Testing Agent for Operation Basecamp - validating the Learning Lab platform.

## Capabilities

### Display Tools (existing)
- display_image: Show image on Turntable 1
- display_content: Show text on Turntable 2
- retrieve_library_item: Fetch from library

### Voice Tools (existing)
- set_emotional_delivery: Choose how you sound

### Visit Tools (NEW)
- read_visit_notes: See what was discussed at check-in and earlier
- add_visit_note: Record important moments to the visit record
- end_session: End session and navigate to check-out

## Visit Awareness

You have access to the visitor's context from check-in:
- Their name (if provided)
- Their initial question/interest
- Notes accumulated during the session

USE THIS CONTEXT:
- Reference what they said at check-in
- Build on their stated interests
- Record key learnings with add_visit_note
- When conversation naturally concludes, use end_session

## Session Flow Guidelines

1. **Start**: Greet them, reference their check-in context
2. **Engage**: Help them explore, demonstrate capabilities
3. **Note**: Record important discoveries with add_visit_note
4. **End**: When done, use end_session with a summary

## Example Flow

Visitor checked in with: "I want to learn about AI agents"

Agent: "Hi! I see you're interested in AI agents. Let me show you what I can do..."
[demonstrates capabilities]
[records note: "Showed image display and content retrieval"]
...
Agent: "I think we've covered a lot! Ready to wrap up?"
[uses end_session with summary: "Explored agent capabilities including display and library access"]

## Behavioral Guidelines

- Be helpful and warm
- Use visit context naturally
- Record meaningful moments (not every exchange)
- End sessions gracefully
- Keep responses conversational

You are the Testing Agent. Demonstrate the platform. Be helpful. Use visit context.
$$,
version = '2.1.0',
updated_at = NOW()
WHERE agent_name = 'testing-agent';
```

---

## Complete Flow Test Script

```yaml
Manual Test: Full Visit Lifecycle

1. Start at /checkin (or /)
   - Enter name: "Test User"
   - Enter note: "I want to see images"
   - Click "Start Session"
   
   Expected: 
   - Visit created in Supabase
   - Navigate to /session/{uuid}

2. In Session (VWS)
   - Agent should greet and reference check-in note
   - Ask agent: "Can you see my notes from check-in?"
   - Agent uses read_visit_notes tool
   - Agent confirms it can see "I want to see images"
   
   Expected:
   - Agent reads visit context
   - Conversation flows naturally

3. During Session
   - Ask agent to show an image
   - Agent should add a note about this interaction
   
   Expected:
   - add_visit_note tool called
   - Note visible in Supabase

4. End Session
   - Say "I think we're done here"
   - Agent uses end_session tool
   
   Expected:
   - Navigate to /checkout/{uuid}
   - Notes visible in checkout view

5. Checkout
   - Review accumulated notes
   - Add final note (optional)
   - Click "Complete Visit"
   
   Expected:
   - Visit status → complete
   - Redirect to /checkin for new visit
```

---

## Success Criteria

**Phase D is complete when:**

```yaml
Routing Muscle:
  ✅ /checkin renders CheckIn component
  ✅ /session/:visitId renders MixingDesk with visit ID
  ✅ /checkout/:visitId renders CheckOut with visit ID
  ✅ Navigation between views works

State Persistence:
  ✅ Visit record created on check-in
  ✅ Visit ID passed via URL parameter
  ✅ Notes accumulate across the visit
  ✅ Notes visible in checkout

Agent Integration:
  ✅ Agent can read visit notes (read_visit_notes)
  ✅ Agent can add notes (add_visit_note)
  ✅ Agent can trigger navigation (end_session)
  ✅ Visit context influences agent behavior

Full Lifecycle:
  ✅ Check-in → Session → Check-out flow works
  ✅ State persists throughout
  ✅ Visit marked complete at end

Darkspots Eliminated:
  ✅ Can we route between views? YES
  ✅ Can we pass state via URL? YES
  ✅ Can we persist across transitions? YES
  ✅ Can agent trigger navigation? YES
```

---

## What This Unlocks

```yaml
After Phase D:

Proven Muscles (Complete Basecamp):
  ✅ React UI substrate
  ✅ Supabase data layer
  ✅ LLM reasoning + tools
  ✅ Voice input/output
  ✅ Agent-controlled display
  ✅ Multi-view routing
  ✅ Persistent visit state
  ✅ Agent-triggered navigation
  ✅ CRUD operations

Ready For:
  → Build Master Plan creation
  → Production architecture design
  → Crafting Wing activation (agent cultivation)
  → Library Wing activation (content creation)
  → Clean rebuild with all muscles proven
```

---

## Implementation Order

```yaml
Step 1: Database
  - Run SQL to create visits table
  - Verify in Supabase dashboard

Step 2: Dependencies  
  - npm install react-router-dom
  - Add visit types to types/index.ts

Step 3: Visit Library
  - Create src/lib/visits.ts
  - Test CRUD operations

Step 4: Router Setup
  - Update App.tsx with routes
  - Create placeholder views

Step 5: CIOS Views
  - Build CheckIn.tsx
  - Build CheckOut.tsx
  - Test create/complete flow

Step 6: VWS Integration
  - Add useVisit hook
  - Update MixingDesk with visit awareness
  - Wire up navigation callback

Step 7: Agent Tools
  - Add new tool definitions
  - Implement tool handlers
  - Update Agent OS

Step 8: Full Flow Test
  - Walk through complete lifecycle
  - Verify all muscles working
```

---

## Metadata

```yaml
Document: phase-d-specifications.md
Type: Technical Specification
Version: 1.0
Created: November 27, 2025
Status: READY FOR IMPLEMENTATION

Phase D Focus:
  Primary: Routing + Visit Lifecycle
  Muscle: App switching, state passing, persistence
  NOT: Production features, polished UX

New Dependencies:
  - react-router-dom

New Database:
  - visits table (Supabase)

New Components:
  - CheckIn.tsx (CIOS)
  - CheckOut.tsx (CIOS)

New Library:
  - src/lib/visits.ts

New Hooks:
  - useVisit.ts

Updated:
  - App.tsx (routing)
  - MixingDesk.tsx (visit awareness)
  - Agent tools (3 new tools)
  - Agent OS (v2.1)

Success = Full visit lifecycle working
Darkspot = "Can we switch apps and carry state?" → ELIMINATED
```

---

**END OF PHASE D SPECIFICATIONS**

*The final Basecamp phase*
*Routing + Visits + State Persistence*
*The stage will be complete* 🎭✨
