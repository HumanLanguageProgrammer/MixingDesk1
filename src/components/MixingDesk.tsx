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
