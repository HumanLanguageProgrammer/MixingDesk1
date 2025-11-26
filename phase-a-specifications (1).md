# PHASE A SPECIFICATIONS: Mixing Desk UI
## Operation Basecamp - React + Supabase Implementation
### For Claude Code Execution
#### November 26, 2025

---

## Mission

**Build a functional Mixing Desk UI that connects to Supabase and displays content.**

This is Phase A of Operation Basecamp - proving the UI substrate works before adding LLM intelligence.

```yaml
What We're Building:
  - React application with Mixing Desk layout
  - Direct Supabase connection (database + storage)
  - Image display capability (Turntable 1)
  - Text content display (Turntable 2)
  - Conversation UI with local state
  - Production deployment to Vercel

What We're NOT Building Yet:
  - LLM integration (Phase B)
  - Voice capabilities (Phase C)
  - Real agent responses
  - Session persistence to database
```

---

## Technology Stack

```yaml
Framework: React 18+ with TypeScript
Build Tool: Vite 5+
Styling: Tailwind CSS 3+
Database Client: @supabase/supabase-js 2+
Deployment: Vercel

No backend required for Phase A.
Direct browser-to-Supabase connection.
```

---

## Supabase Configuration (Verified)

```yaml
Project: Operation Basecamp
URL: https://evtrcspwpxnygvjfpbng.supabase.co

Database Tables:
  
  library_items (verified schema):
    - id: uuid (PK)
    - title: text
    - content: text
    - content_type: text (NOTE: not 'item_type')
    - complexity: text ('simple' | 'intermediate' | 'advanced')
    - topics: text[]
    - tags: text[]
    - retrieval_count: integer
    - last_retrieved_at: timestamp (nullable)
    - created_at: timestamp
    - updated_at: timestamp
  
  sessions (for Phase B):
    - id: uuid (PK)
    - session_identifier: text (unique)
    - visitor_context: jsonb
    - started_at: timestamp
    - last_active_at: timestamp
    - status: text ('active' | 'completed' | 'abandoned')
    - created_at: timestamp
    - updated_at: timestamp
  
  messages (for Phase B):
    - id: uuid (PK)
    - session_id: uuid (FK -> sessions)
    - speaker: text ('visitor' | 'agent')
    - content: text
    - message_type: text ('text' | 'voice' | 'system')
    - sequence_number: integer
    - tokens_used: integer (nullable)
    - created_at: timestamp

Storage Bucket:
  - test-images (public read access)
  - Contains: "LLMs for Business v3.jpg"

RLS Policies:
  - Anon SELECT on library_items: enabled
  - Public read on test-images: enabled

Environment Variables Needed:
  VITE_SUPABASE_URL=https://evtrcspwpxnygvjfpbng.supabase.co
  VITE_SUPABASE_ANON_KEY=[anon key from Supabase dashboard]
```

---

## Project Structure

```
mixing-desk/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── MixingDesk.tsx        # Main container
│   │   ├── Turntable1.tsx        # Image display
│   │   ├── Turntable2.tsx        # Content/response display
│   │   ├── Microphone.tsx        # Input interface
│   │   ├── MessageHistory.tsx    # Conversation log
│   │   └── StatusIndicator.tsx   # Connection state
│   ├── lib/
│   │   └── supabase.ts           # Supabase client
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind imports
├── .env.example                  # Environment template
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## TypeScript Interfaces

```typescript
// src/types/index.ts

// Local UI State (Phase A)
export interface Message {
  id: string;
  speaker: 'visitor' | 'agent';
  content: string;
  timestamp: Date;
}

// Database Record (matches actual Supabase schema)
export interface LibraryItem {
  id: string;
  title: string;
  content: string;
  content_type: string;  // Note: 'content_type' not 'item_type'
  complexity: 'simple' | 'intermediate' | 'advanced';
  topics: string[];
  tags: string[];
  retrieval_count: number;
  last_retrieved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageAsset {
  name: string;
  url: string;
}

export interface ConnectionStatus {
  database: 'connected' | 'disconnected' | 'error';
  storage: 'connected' | 'disconnected' | 'error';
}

export interface MixingDeskState {
  messages: Message[];
  currentImage: ImageAsset | null;
  currentContent: string;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
}

// For Phase B (documented here for reference)
export interface SessionRecord {
  id: string;
  session_identifier: string;
  visitor_context: Record<string, unknown> | null;
  started_at: string;
  last_active_at: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  session_id: string | null;
  speaker: 'visitor' | 'agent';
  content: string;
  message_type: 'text' | 'voice' | 'system';
  sequence_number: number;
  tokens_used: number | null;
  created_at: string;
}
```

---

## Supabase Client

```typescript
// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Fetch all library items
export async function fetchLibraryItems() {
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching library items:', error);
    throw error;
  }
  
  return data;
}

// Helper: Fetch single library item by ID
export async function fetchLibraryItem(id: string) {
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching library item:', error);
    throw error;
  }
  
  return data;
}

// Helper: Get public URL for storage item
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper: List files in storage bucket
export async function listStorageFiles(bucket: string) {
  const { data, error } = await supabase.storage.from(bucket).list();
  
  if (error) {
    console.error('Error listing storage files:', error);
    throw error;
  }
  
  return data;
}

// Helper: Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('library_items')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}
```

---

## Component Specifications

### App.tsx (Root Component)

```typescript
// src/App.tsx

import { MixingDesk } from './components/MixingDesk';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <MixingDesk />
    </div>
  );
}

export default App;
```

---

### MixingDesk.tsx (Main Container)

```typescript
// src/components/MixingDesk.tsx

import { useState, useEffect } from 'react';
import { Turntable1 } from './Turntable1';
import { Turntable2 } from './Turntable2';
import { Microphone } from './Microphone';
import { MessageHistory } from './MessageHistory';
import { StatusIndicator } from './StatusIndicator';
import { 
  testConnection, 
  fetchLibraryItems, 
  getStorageUrl,
  listStorageFiles 
} from '../lib/supabase';
import type { Message, ConnectionStatus, LibraryItem, ImageAsset } from '../types';

export function MixingDesk() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageAsset | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    database: 'disconnected',
    storage: 'disconnected',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    initializeDesk();
  }, []);

  async function initializeDesk() {
    setIsLoading(true);
    
    try {
      // Test database connection
      const dbConnected = await testConnection();
      setConnectionStatus(prev => ({
        ...prev,
        database: dbConnected ? 'connected' : 'error',
      }));

      if (dbConnected) {
        // Fetch library items
        const items = await fetchLibraryItems();
        setLibraryItems(items || []);
        
        // Set initial content from first library item
        if (items && items.length > 0) {
          setCurrentContent(items[0].content);
        }
      }

      // Test storage - list files and load first image
      try {
        const files = await listStorageFiles('test-images');
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'connected',
        }));

        // Load first image if available
        if (files && files.length > 0) {
          const imageFile = files.find(f => 
            f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          );
          if (imageFile) {
            const url = getStorageUrl('test-images', imageFile.name);
            setCurrentImage({ name: imageFile.name, url });
          }
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'error',
        }));
      }

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle visitor message submission
  function handleSendMessage(content: string) {
    if (!content.trim()) return;

    // Add visitor message
    const visitorMessage: Message = {
      id: crypto.randomUUID(),
      speaker: 'visitor',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, visitorMessage]);

    // Add placeholder agent response
    // (In Phase B, this will be replaced with LLM call)
    setTimeout(() => {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        speaker: 'agent',
        content: `I received your message: "${content.trim()}". In Phase B, I'll be connected to an LLM and can provide real responses.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 500);
  }

  // Handle library item selection (for testing)
  function handleSelectLibraryItem(item: LibraryItem) {
    setCurrentContent(item.content);
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-100">
            Mixing Desk
            <span className="ml-2 text-sm font-normal text-gray-400">
              Operation Basecamp
            </span>
          </h1>
          <StatusIndicator status={connectionStatus} isLoading={isLoading} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Turntables */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-auto">
          {/* Turntable 1: Image Display */}
          <div className="flex-1 min-h-[300px]">
            <Turntable1 
              image={currentImage} 
              isLoading={isLoading} 
            />
          </div>

          {/* Turntable 2: Content Display */}
          <div className="flex-1 min-h-[300px]">
            <Turntable2 
              content={currentContent}
              libraryItems={libraryItems}
              onSelectItem={handleSelectLibraryItem}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Column: Conversation */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-700">
          {/* Message History */}
          <div className="flex-1 overflow-hidden">
            <MessageHistory messages={messages} />
          </div>

          {/* Microphone (Input) */}
          <div className="border-t border-gray-700">
            <Microphone onSend={handleSendMessage} />
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

### Turntable1.tsx (Image Display)

```typescript
// src/components/Turntable1.tsx

import type { ImageAsset } from '../types';

interface Turntable1Props {
  image: ImageAsset | null;
  isLoading: boolean;
}

export function Turntable1({ image, isLoading }: Turntable1Props) {
  return (
    <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300">
          Turntable 1
          <span className="ml-2 text-gray-500 font-normal">Visual Display</span>
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        {isLoading ? (
          <div className="text-gray-500">
            <LoadingSpinner />
            <p className="mt-2 text-sm">Loading image...</p>
          </div>
        ) : image ? (
          <div className="w-full h-full flex flex-col">
            <img
              src={image.url}
              alt={image.name}
              className="max-w-full max-h-full object-contain rounded"
              onError={(e) => {
                console.error('Image load error:', image.url);
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23374151" width="100" height="100"/><text fill="%239CA3AF" x="50" y="50" text-anchor="middle" dy=".3em" font-size="12">Error</text></svg>';
              }}
            />
            <p className="mt-2 text-xs text-gray-500 text-center truncate">
              {image.name}
            </p>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No image loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
```

---

### Turntable2.tsx (Content Display)

```typescript
// src/components/Turntable2.tsx

import type { LibraryItem } from '../types';

interface Turntable2Props {
  content: string;
  libraryItems: LibraryItem[];
  onSelectItem: (item: LibraryItem) => void;
  isLoading: boolean;
}

export function Turntable2({ content, libraryItems, onSelectItem, isLoading }: Turntable2Props) {
  return (
    <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300">
          Turntable 2
          <span className="ml-2 text-gray-500 font-normal">Content Display</span>
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">Loading content...</p>
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">No content loaded</p>
          </div>
        )}
      </div>

      {/* Library Item Selector (for testing) */}
      {libraryItems.length > 0 && (
        <div className="border-t border-gray-700 p-3">
          <p className="text-xs text-gray-500 mb-2">Library Items (test selector):</p>
          <div className="flex flex-wrap gap-2">
            {libraryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### MessageHistory.tsx (Conversation Log)

```typescript
// src/components/MessageHistory.tsx

import { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface MessageHistoryProps {
  messages: Message[];
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gray-850">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-sm font-medium text-gray-300">Conversation</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation below</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isVisitor = message.speaker === 'visitor';
  
  return (
    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isVisitor
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isVisitor ? 'text-blue-200' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
```

---

### Microphone.tsx (Input Interface)

```typescript
// src/components/Microphone.tsx

import { useState, useRef, useEffect } from 'react';

interface MicrophoneProps {
  onSend: (message: string) => void;
}

export function Microphone({ onSend }: MicrophoneProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
```

---

### StatusIndicator.tsx (Connection State)

```typescript
// src/components/StatusIndicator.tsx

import type { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  isLoading: boolean;
}

export function StatusIndicator({ status, isLoading }: StatusIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  const allConnected = status.database === 'connected' && status.storage === 'connected';
  const hasError = status.database === 'error' || status.storage === 'error';

  return (
    <div className="flex items-center gap-4">
      <StatusDot 
        label="Database" 
        status={status.database} 
      />
      <StatusDot 
        label="Storage" 
        status={status.storage} 
      />
    </div>
  );
}

function StatusDot({ label, status }: { label: string; status: 'connected' | 'disconnected' | 'error' }) {
  const colors = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
```

---

## Configuration Files

### package.json

```json
{
  "name": "mixing-desk",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
```

---

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1a1d23',
        },
      },
    },
  },
  plugins: [],
}
```

---

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mixing Desk - Operation Basecamp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### src/main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
```

---

### .env.example

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### .gitignore

```
# Dependencies
node_modules
.pnp
.pnp.js

# Build
dist
dist-ssr
*.local

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

---

## Deployment Procedure (For Michael)

### Step 1: Claude Code Generates Project

Have Claude Code create the full project structure following these specifications.

### Step 2: Push to GitHub

```bash
# Initialize git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "Phase A: Mixing Desk UI with Supabase integration"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/mixing-desk.git

# Push
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist
5. Add Environment Variables:
   - `VITE_SUPABASE_URL` = `https://evtrcspwpxnygvjfpbng.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = [your anon key]
6. Click Deploy

### Step 4: Verify Deployment

Check the following:

- [ ] Live URL loads without errors
- [ ] Status indicators show "Connected" for Database and Storage
- [ ] Test image displays on Turntable 1
- [ ] Library items load and display on Turntable 2
- [ ] Can type and send messages
- [ ] Messages appear in conversation history
- [ ] Placeholder responses appear
- [ ] UI is responsive (test mobile view)

---

## Success Criteria

**Phase A is complete when:**

```yaml
Technical:
  ✓ React app deployed to Vercel
  ✓ Supabase connection working in production
  ✓ Test image displays from storage
  ✓ Library items query and display
  ✓ Conversation UI functional (local state)
  ✓ No console errors

Platform Capability Validated:
  ✓ "Show" capability proven (image display)
  ✓ Direct Supabase connection pattern works
  ✓ Deployment pipeline established
  ✓ Ready for Phase B (LLM integration)
```

---

## Notes for Phase B

When ready for LLM integration, we'll need:

1. **Server-side API route** (for Anthropic key security)
   - Option: Vercel Serverless Functions
   - Option: Railway backend (evaluate when we get there)

2. **Anthropic service module**
   - Replace placeholder responses with real LLM calls
   - Implement tool use for content retrieval/display

3. **Enhanced state management**
   - Agent-controlled image display
   - Agent-controlled content display
   - Working memory (conversation context)

The UI substrate built in Phase A will remain largely unchanged - we're just adding intelligence behind the placeholder responses.

---

## Metadata

```yaml
Document: phase-a-specifications.md
Type: Technical Specification for Claude Code
Version: 1.1 (Updated with verified schemas)
Created: November 26, 2025
Updated: November 26, 2025

Status: PHASE A COMPLETE ✅
  Live URL: https://mixing-desk1-pkb9.vercel.app/
  All capabilities validated

Updates in v1.1:
  - Corrected LibraryItem interface (content_type not item_type)
  - Added full schema documentation for all tables
  - Added SessionRecord and MessageRecord types for Phase B reference
  - Documented RLS policies
  - Marked as complete with live URL

Purpose:
  Complete specifications for Phase A implementation
  Claude Code can execute without ambiguity
  Production-ready React + Supabase application

Validated Capabilities:
  ✓ React app deployed to Vercel
  ✓ Supabase database connection working
  ✓ Supabase storage connection working
  ✓ Test image displays from storage
  ✓ Library items query and display
  ✓ Conversation UI functional (local state)

Next Phase:
  Phase B - LLM Integration (see phase-b-specifications.md)

For:
  Claude Code (implementation)
  Michael (deployment + verification)
  Digital Operations Workspace (documentation)
```

---

**END OF PHASE A SPECIFICATIONS**

*Ready for Claude Code execution*
*Deploy to Vercel when complete*
*Phase B (LLM) follows successful validation* 🎯
