'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    messages,
    isAuthenticated,
    username,
    conversations,
    activeSessionId,
    saveHistory,
    crisisAlert,
    isLoading,
    isCreatingConversation,
    isConversationListLoading,
    isSessionLoading,
    conversationError,
    deletingConversationId,
    useThinking,
    searchMode,
    useAgent,
    historyMode,
    setUseThinking,
    setSearchMode,
    setUseAgent,
    handleSaveHistoryChange,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleFeedback,
    retryActiveConversation,
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

  const handleMobileNewConversation = async () => {
    await handleNewConversation();
    setMobileSidebarOpen(false);
  };

  const handleMobileSelectConversation = async (sessionId: number) => {
    await handleSelectConversation(sessionId);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(247,251,251,0.95))]">
      <ChatSidebar
        isAuthenticated={isAuthenticated}
        username={username}
        conversations={conversations}
        activeSessionId={activeSessionId}
        historyMode={historyMode}
        isCreatingConversation={isCreatingConversation}
        isConversationListLoading={isConversationListLoading}
        deletingConversationId={deletingConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        className="hidden md:flex"
      />

      {mobileSidebarOpen && (
        <div className="absolute inset-0 z-30 flex md:hidden">
          <button
            type="button"
            aria-label="关闭会话面板遮罩"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex-1 bg-slate-900/25 backdrop-blur-[1px]"
          />
          <ChatSidebar
            isAuthenticated={isAuthenticated}
            username={username}
            conversations={conversations}
            activeSessionId={activeSessionId}
            historyMode={historyMode}
            isCreatingConversation={isCreatingConversation}
            isConversationListLoading={isConversationListLoading}
            deletingConversationId={deletingConversationId}
            onClose={() => setMobileSidebarOpen(false)}
            onNewConversation={handleMobileNewConversation}
            onSelectConversation={handleMobileSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            className="flex w-[82vw] max-w-[20rem] shadow-[0_20px_60px_rgba(20,40,50,0.18)]"
          />
        </div>
      )}

      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        <ChatTopBar
          networkOnline={networkOnline}
          isAuthenticated={isAuthenticated}
          saveHistory={saveHistory}
          onToggleSaveHistory={handleSaveHistoryChange}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

        {crisisAlert?.show && <CrisisAlertCard alert={crisisAlert} />}

        <div className="w-full min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 md:pb-32" ref={scrollRef}>
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            isConversationLoading={isSessionLoading}
            conversationError={conversationError}
            activeSessionId={activeSessionId}
            onFeedback={handleFeedback}
            onRetryConversation={retryActiveConversation}
          />
        </div>

        <div className="border-t border-white/60 bg-[linear-gradient(180deg,rgba(238,246,245,0.82),rgba(238,246,245,0.96))] px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 backdrop-blur md:absolute md:bottom-0 md:left-0 md:w-full md:border-t-0 md:bg-gradient-to-t md:from-[#eef6f5] md:via-[#eef6f5] md:to-transparent md:px-4 md:pb-4 md:pt-10">
          <ChatComposer
            input={input}
            onChange={setInput}
            onSend={handleSend}
            isLoading={isLoading}
            useThinking={useThinking}
            searchMode={searchMode}
            useAgent={useAgent}
            onToggleThinking={() => setUseThinking((prev) => !prev)}
            onToggleSearchMode={() => setSearchMode((prev) => (prev === 'index' ? 'rag' : 'index'))}
            onToggleAgent={() => setUseAgent((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}
