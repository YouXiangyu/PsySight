import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  agentChat,
  chatWithAI,
  getConversationMessages,
  getMe,
  listConversations,
  sendMessageFeedback,
} from '@/lib/api';
import type { Message, CrisisAlert } from '../types';

const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: 'assistant',
  content: '你好，我是 PsySight。谢谢你愿意来到这里。你可以从最近最困扰你的一件小事开始说，我会认真听。',
};

export function useChatState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: number; title: string }>>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [saveHistory, setSaveHistory] = useState(true);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [searchMode, setSearchMode] = useState<'index' | 'rag'>('index');
  const [useAgent, setUseAgent] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const activeSessionFromQuery = useMemo(() => {
    const value = searchParams.get('session');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await listConversations();
      setConversations(response.items.map((item) => ({ id: item.id, title: item.title })));
    } catch {
      setConversations([]);
    }
  }, []);

  const loadConversationMessages = useCallback(async (sessionId: number) => {
    try {
      const response = await getConversationMessages(sessionId);
      const mapped: Message[] = response.items.map((item) => ({
        id: item.id,
        role: item.role,
        content: item.content,
        recommended_scale: item.recommended_scale?.id
          ? {
              id: item.recommended_scale.id,
              code: item.recommended_scale.code,
              title: item.recommended_scale.title || '',
            }
          : undefined,
      }));
      setMessages(mapped.length ? mapped : [{ role: 'assistant', content: '这个会话还没有消息，我们从现在开始吧。' }]);
      setActiveSessionId(sessionId);
    } catch {
      setMessages([{ role: 'assistant', content: '会话加载失败，请稍后重试。', isError: true }]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await getMe();
        setIsAuthenticated(me.authenticated);
        setUsername(me.user?.username || null);
        setUserId(me.user?.id || null);
        setSaveHistory(me.authenticated);
        if (me.authenticated) {
          await loadConversations();
          if (activeSessionFromQuery) {
            await loadConversationMessages(activeSessionFromQuery);
          }
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    init();
  }, [activeSessionFromQuery, loadConversationMessages, loadConversations]);

  useEffect(() => {
    if (isAuthenticated && activeSessionFromQuery && activeSessionFromQuery !== activeSessionId) {
      loadConversationMessages(activeSessionFromQuery);
    }
  }, [activeSessionFromQuery, activeSessionId, isAuthenticated, loadConversationMessages]);

  useEffect(() => {
    if (!isAuthenticated && activeSessionFromQuery && activeSessionFromQuery !== activeSessionId) {
      setActiveSessionId(activeSessionFromQuery);
    }
  }, [activeSessionFromQuery, activeSessionId, isAuthenticated]);

  const handleNewConversation = useCallback(() => {
    setMessages([{ role: 'assistant', content: '新的对话已开始。你现在最想先聊哪一件事？' }]);
    setActiveSessionId(null);
    setCrisisAlert(null);
    router.replace('/');
  }, [router]);

  const handleSelectConversation = useCallback(
    (sessionId: number) => {
      setActiveSessionId(sessionId);
      router.replace(`/?session=${sessionId}`);
      loadConversationMessages(sessionId);
    },
    [loadConversationMessages, router]
  );

  const handleFeedback = useCallback(async (messageId: number, feedback: 'up' | 'down') => {
    try {
      await sendMessageFeedback(messageId, feedback);
      setMessages((prev) => prev.map((item) => (item.id === messageId ? { ...item, feedback } : item)));
    } catch {
      // 反馈失败不阻塞聊天
    }
  }, []);

  const sendMessage = useCallback(
    async (rawInput: string) => {
      if (!rawInput.trim() || isLoading) return;

      const userMsg = rawInput.trim();
      setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
      setIsLoading(true);

      try {
        if (useAgent) {
          const data = await agentChat({
            message: userMsg,
            session_id: activeSessionId,
            user_id: userId,
            anonymous: !isAuthenticated || !saveHistory,
            use_thinking: useThinking,
            search_mode: searchMode,
          });
          const assistantMsg: Message = {
            id: data.assistant_message_id || undefined,
            role: 'assistant',
            content: data.reply,
            recommended_scales: data.recommended_scales?.length ? data.recommended_scales : undefined,
            model_used: data.model_used,
            intent_detected: data.intent_detected,
            conversation_goal: data.conversation_goal,
            follow_up_question: data.follow_up_question,
          };
          if (data.crisis_alert?.show) {
            setCrisisAlert(data.crisis_alert);
          }
          if (data.session_id && data.session_id !== activeSessionId) {
            setActiveSessionId(data.session_id);
            router.replace(`/?session=${data.session_id}`);
          }
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          const data = await chatWithAI({
            message: userMsg,
            session_id: activeSessionId,
            anonymous: !isAuthenticated || !saveHistory,
          });
          const assistantMsg: Message = {
            id: data.assistant_message_id || undefined,
            role: 'assistant',
            content: data.reply,
            recommended_scale: data.recommended_scale
              ? {
                  id: data.recommended_scale.id,
                  code: data.recommended_scale.code,
                  title: data.recommended_scale.title,
                }
              : undefined,
          };
          if (data.crisis_alert?.show) {
            setCrisisAlert(data.crisis_alert);
          }
          if (data.session_id && data.session_id !== activeSessionId) {
            setActiveSessionId(data.session_id);
            router.replace(`/?session=${data.session_id}`);
          }
          setMessages((prev) => [...prev, assistantMsg]);
        }
        if (isAuthenticated) {
          loadConversations();
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: (error as Error).message || '连接 AI 服务失败。请检查后端是否启动。',
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, isAuthenticated, isLoading, loadConversations, router, saveHistory, useAgent, useThinking, searchMode, userId]
  );

  return {
    messages,
    isAuthenticated,
    username,
    conversations,
    activeSessionId,
    saveHistory,
    crisisAlert,
    isLoading,
    useThinking,
    searchMode,
    useAgent,
    setUseThinking,
    setSearchMode,
    setUseAgent,
    setSaveHistory,
    handleNewConversation,
    handleSelectConversation,
    handleFeedback,
    sendMessage,
  };
}
