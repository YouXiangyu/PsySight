'use client';

import React, { useEffect, useRef } from 'react';

import ChatComposer from '@/features/chat/components/ChatComposer';
import ChatMessageList from '@/features/chat/components/ChatMessageList';
import ChatSidebar from '@/features/chat/components/ChatSidebar';
import ChatTopBar from '@/features/chat/components/ChatTopBar';
import CrisisAlertCard from '@/features/chat/components/CrisisAlertCard';
import { useChatState } from '@/features/chat/hooks/useChatState';
import { useDraftPersistence } from '@/features/chat/hooks/useDraftPersistence';
import { useNetworkStatus } from '@/features/chat/hooks/useNetworkStatus';

const DRAFT_KEY = 'psysight_chat_draft_v1';

export default function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const networkOnline = useNetworkStatus();
  const [input, setInput] = useDraftPersistence(DRAFT_KEY);
  const {
    messages,
    isAuthenticated,
    username,
    conversations,
    activeSessionId,
    saveHistory,
    crisisAlert,
    isLoading,
    setSaveHistory,
    handleNewConversation,
    handleSelectConversation,
    handleFeedback,
    sendMessage,
  } = useChatState();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const payload = input;
    if (!payload.trim()) return;
    setInput('');
    await sendMessage(payload);
  };

  return (
    <div className="flex h-full w-full bg-[#f7f8fb]">
      <ChatSidebar
        isAuthenticated={isAuthenticated}
        username={username}
        conversations={conversations}
        activeSessionId={activeSessionId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
      />

      <div className="relative flex flex-1 flex-col h-full">
        <ChatTopBar
          networkOnline={networkOnline}
          isAuthenticated={isAuthenticated}
          saveHistory={saveHistory}
          onToggleSaveHistory={setSaveHistory}
        />

        {crisisAlert?.show && <CrisisAlertCard alert={crisisAlert} />}

        <div className="flex-1 overflow-y-auto w-full pb-32" ref={scrollRef}>
          <ChatMessageList messages={messages} isLoading={isLoading} onFeedback={handleFeedback} />
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#f7f8fb] via-[#f7f8fb] to-transparent pt-10 pb-4 px-4">
          <ChatComposer input={input} onChange={setInput} onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
