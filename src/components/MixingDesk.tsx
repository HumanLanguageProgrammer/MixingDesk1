// src/components/MixingDesk.tsx
// PHASE B: Integrated with agent

import { useState, useEffect, useCallback } from 'react';
import { Turntable1 } from './Turntable1';
import { Turntable2 } from './Turntable2';
import { Microphone } from './Microphone';
import { MessageHistory } from './MessageHistory';
import { StatusIndicator } from './StatusIndicator';
import { useAgent } from '../hooks/useAgent';
import {
  testConnection,
  listStorageFiles
} from '../lib/supabase';
import type { Message, ConnectionStatus, ImageAsset, ToolExecutionResult } from '../types';

export function MixingDesk() {
  // Agent state
  const {
    isInitialized: agentInitialized,
    isLoading: agentLoading,
    error: agentError,
    agentOS,
    initialize: initializeAgent,
    chat,
    clearError
  } = useAgent();

  // UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageAsset | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [currentContentTitle, setCurrentContentTitle] = useState<string>('');
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

      // Test storage
      try {
        await listStorageFiles('test-images');
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'connected',
        }));
      } catch (storageError) {
        console.error('Storage error:', storageError);
        setConnectionStatus(prev => ({
          ...prev,
          storage: 'error',
        }));
      }

      // Initialize agent
      await initializeAgent();

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Process tool results from agent
  const processToolResults = useCallback((results: ToolExecutionResult[]) => {
    for (const result of results) {
      if (!result.success) continue;

      switch (result.tool) {
        case 'display_image':
          if (result.data?.image_url) {
            setCurrentImage({
              name: 'Agent displayed image',
              url: result.data.image_url as string,
            });
          }
          break;

        case 'display_content':
          if (result.data?.content) {
            setCurrentContent(result.data.content as string);
            setCurrentContentTitle((result.data.title as string) || '');
          }
          break;

        case 'retrieve_library_item':
          // Content will be displayed via display_content tool
          // This just fetches the data
          break;
      }
    }
  }, []);

  // Handle visitor message submission
  async function handleSendMessage(content: string) {
    if (!content.trim()) return;

    // Add visitor message
    const visitorMessage: Message = {
      id: crypto.randomUUID(),
      speaker: 'visitor',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, visitorMessage]);

    // Check if agent is ready
    if (!agentInitialized || !agentOS) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        speaker: 'agent',
        content: 'I\'m still initializing. Please wait a moment and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add placeholder for streaming
    const agentMessageId = crypto.randomUUID();
    const agentMessage: Message = {
      id: agentMessageId,
      speaker: 'agent',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, agentMessage]);

    try {
      // Get agent response
      const { response, toolResults } = await chat(content.trim(), messages);

      // Process any tool results (updates Turntables)
      processToolResults(toolResults);

      // Update agent message with response
      setMessages(prev =>
        prev.map(m =>
          m.id === agentMessageId
            ? { ...m, content: response, isStreaming: false }
            : m
        )
      );

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === agentMessageId
            ? {
                ...m,
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false
              }
            : m
        )
      );
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-100">
            Mixing Desk
            <span className="ml-2 text-sm font-normal text-gray-400">
              Operation Basecamp • Phase B
            </span>
            {agentOS && (
              <span className="ml-2 text-xs font-normal text-green-400">
                ({agentOS.agent_name} v{agentOS.version})
              </span>
            )}
          </h1>
          <StatusIndicator
            status={connectionStatus}
            isLoading={isLoading}
            agentStatus={agentInitialized ? 'connected' : agentLoading ? 'connecting' : 'disconnected'}
          />
        </div>
        {agentError && (
          <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
            <span>Agent error: {agentError}</span>
            <button
              onClick={clearError}
              className="text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
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
              title={currentContentTitle}
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
            <Microphone onSend={handleSendMessage} disabled={!agentInitialized} />
          </div>
        </div>
      </main>
    </div>
  );
}
