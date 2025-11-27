// src/components/MixingDesk.tsx
// PHASE C: Integrated with voice and emotional agency

import { useState, useEffect, useCallback } from 'react';
import { Turntable1 } from './Turntable1';
import { Turntable2 } from './Turntable2';
import { Microphone } from './Microphone';
import { MessageHistory } from './MessageHistory';
import { StatusIndicator } from './StatusIndicator';
import { useAgent } from '../hooks/useAgent';
import { useVoice } from '../hooks/useVoice';
import {
  testConnection,
  listStorageFiles
} from '../lib/supabase';
import type {
  Message,
  ConnectionStatus,
  ImageAsset,
  ToolExecutionResult,
  EmotionAnalysis,
  ProsodyAnalysis,
  EmotionalDelivery,
  EmotionalContext,
} from '../types';

export function MixingDesk() {
  // Agent state
  const {
    isInitialized: agentInitialized,
    isLoading: agentLoading,
    error: agentError,
    agentOS,
    initialize: initializeAgent,
    chat,
    chatWithEmotion,
    clearError
  } = useAgent();

  // Voice state (Phase C)
  const {
    isEnabled: voiceEnabled,
    isSupported: voiceSupported,
    isRecording,
    recordingDuration,
    isProcessingSTT,
    isPlayingTTS,
    error: voiceError,
    startRecording,
    stopRecordingAndTranscribe,
    speakText,
    stopSpeaking,
    clearError: clearVoiceError,
    toggleVoice,
  } = useVoice();

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

  // Handle visitor message submission (text only)
  async function handleSendMessage(content: string) {
    await sendMessageToAgent(content);
  }

  // Handle visitor message with emotion context (voice input)
  async function handleSendWithEmotion(
    content: string,
    emotions: EmotionAnalysis,
    prosody: ProsodyAnalysis
  ) {
    await sendMessageToAgent(content, { detected_emotions: emotions, prosody });
  }

  // Core message handling with optional emotional context
  async function sendMessageToAgent(content: string, emotionalContext?: EmotionalContext) {
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
      // Get agent response (with or without emotional context)
      let response: string;
      let toolResults: ToolExecutionResult[];
      let emotionalDelivery: EmotionalDelivery | undefined;

      if (emotionalContext && chatWithEmotion) {
        const result = await chatWithEmotion(content.trim(), messages, emotionalContext);
        response = result.response;
        toolResults = result.toolResults;
        emotionalDelivery = result.emotionalDelivery;
      } else {
        const result = await chat(content.trim(), messages);
        response = result.response;
        toolResults = result.toolResults;
        emotionalDelivery = result.emotionalDelivery;
      }

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

      // Phase C: Speak the response with TTS (if voice enabled)
      if (voiceEnabled && response) {
        await speakText(response, emotionalDelivery);
      }

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

  // Combined error from agent or voice
  const displayError = agentError || voiceError;
  const handleClearError = () => {
    clearError();
    clearVoiceError();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-100">
              Mixing Desk
              <span className="ml-2 text-sm font-normal text-blue-400">
                Operation Basecamp • Phase C • v1.1
              </span>
              {agentOS && (
                <span className="ml-2 text-xs font-normal text-green-400">
                  ({agentOS.agent_name} v{agentOS.version})
                </span>
              )}
            </h1>

            {/* Voice toggle (Phase C) */}
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-colors
                  ${voiceEnabled
                    ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                    : 'bg-gray-700 text-gray-400 border border-gray-600'
                  }
                `}
                title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              >
                <VoiceIcon enabled={voiceEnabled} />
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </button>
            )}
          </div>

          <StatusIndicator
            status={connectionStatus}
            isLoading={isLoading}
            agentStatus={agentInitialized ? 'connected' : agentLoading ? 'connecting' : 'disconnected'}
            voiceStatus={voiceEnabled ? (isRecording ? 'recording' : isPlayingTTS ? 'speaking' : 'ready') : 'disabled'}
          />
        </div>

        {displayError && (
          <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
            <span>Error: {displayError}</span>
            <button
              onClick={handleClearError}
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

          {/* Microphone (Input) - Phase C enhanced */}
          <div className="border-t border-gray-700">
            <Microphone
              onSend={handleSendMessage}
              onSendWithEmotion={handleSendWithEmotion}
              disabled={!agentInitialized}
              voiceEnabled={voiceEnabled}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              isProcessingSTT={isProcessingSTT}
              isPlayingTTS={isPlayingTTS}
              onStartRecording={startRecording}
              onStopRecording={stopRecordingAndTranscribe}
              onStopSpeaking={stopSpeaking}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Voice icon component
function VoiceIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${enabled ? 'text-green-400' : 'text-gray-500'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {enabled ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zm9.414-6l4 4m0-4l-4 4"
        />
      )}
    </svg>
  );
}
