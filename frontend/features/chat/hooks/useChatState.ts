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

const LOCAL_CONVERSATION_INDEX_KEY = 'psysight_chat_local_conversations_v1';
const LOCAL_CONVERSATION_MESSAGES_PREFIX = 'psysight_chat_local_messages_';
const SAVE_HISTORY_PREF_KEY = 'psysight_chat_save_history_v1';

type ConversationSummary = {
  id: number;
  title: string;
};

type StoredConversationSummary = ConversationSummary & {
  updated_at: string;
};

const isLocalSession = (sessionId: number | null | undefined): sessionId is number =>
  typeof sessionId === 'number' && sessionId < 0;

const getLocalMessagesKey = (sessionId: number) => `${LOCAL_CONVERSATION_MESSAGES_PREFIX}${sessionId}`;

const getDefaultMessages = (): Message[] => [{ ...INITIAL_ASSISTANT_MESSAGE }];

const truncateTitle = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return '新对话';
  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed;
};

const buildConversationTitle = (items: Message[]) => {
  const firstUserMessage = items.find((item) => item.role === 'user' && item.content.trim());
  return truncateTitle(firstUserMessage?.content || '');
};

const readStoredLocalConversationIndex = (): StoredConversationSummary[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CONVERSATION_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredConversationSummary =>
        typeof item?.id === 'number' && typeof item?.title === 'string' && typeof item?.updated_at === 'string'
    );
  } catch {
    return [];
  }
};

const readSaveHistoryPreference = (fallback: boolean) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(SAVE_HISTORY_PREF_KEY);
    if (value == null) return fallback;
    return value === '1';
  } catch {
    return fallback;
  }
};

const persistSaveHistoryPreference = (value: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_HISTORY_PREF_KEY, value ? '1' : '0');
  } catch {
    // Ignore local persistence failures.
  }
};

const readLocalConversationIndex = (): ConversationSummary[] => {
  return readStoredLocalConversationIndex()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((item) => ({ id: item.id, title: item.title }));
};

const readLocalConversationMessages = (sessionId: number): Message[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getLocalMessagesKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const items = parsed.filter(
      (item): item is Message =>
        (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string'
    );
    return items.length ? items : null;
  } catch {
    return null;
  }
};

const persistLocalConversation = (sessionId: number, items: Message[]) => {
  if (typeof window === 'undefined') return;
  const hasUserMessages = items.some((item) => item.role === 'user' && item.content.trim());
  if (!hasUserMessages) return;

  try {
    window.localStorage.setItem(getLocalMessagesKey(sessionId), JSON.stringify(items));
    const nextRecord: StoredConversationSummary = {
      id: sessionId,
      title: buildConversationTitle(items),
      updated_at: new Date().toISOString(),
    };

    const existing = readStoredLocalConversationIndex();
    const merged = [nextRecord, ...existing.filter((item) => item.id !== sessionId)];

    window.localStorage.setItem(LOCAL_CONVERSATION_INDEX_KEY, JSON.stringify(merged));
  } catch {
    // Ignore local persistence failures.
  }
};

export function useChatState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>(getDefaultMessages);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [saveHistory, setSaveHistory] = useState(false);
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

  const historyMode = useMemo<'account' | 'local'>(() => {
    if (!isAuthenticated || !saveHistory || isLocalSession(activeSessionId)) {
      return 'local';
    }
    return 'account';
  }, [activeSessionId, isAuthenticated, saveHistory]);

  const loadBackendConversations = useCallback(async () => {
    try {
      const response = await listConversations();
      setConversations(response.items.map((item) => ({ id: item.id, title: item.title })));
    } catch {
      setConversations([]);
    }
  }, []);

  const loadLocalConversations = useCallback(() => {
    setConversations(readLocalConversationIndex());
  }, []);

  const loadLocalConversationMessages = useCallback((sessionId: number) => {
    const restored = readLocalConversationMessages(sessionId);
    setMessages(restored?.length ? restored : getDefaultMessages());
    setActiveSessionId(sessionId);
    setCrisisAlert(null);
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
      setCrisisAlert(null);
    } catch {
      setMessages([{ role: 'assistant', content: '会话加载失败，请稍后重试。', isError: true }]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await getMe();
        const authenticated = me.authenticated;
        const preferredSaveHistory = authenticated ? readSaveHistoryPreference(true) : false;

        setIsAuthenticated(authenticated);
        setUsername(me.user?.username || null);
        setUserId(me.user?.id || null);
        setSaveHistory(preferredSaveHistory);

        if (authenticated && preferredSaveHistory && activeSessionFromQuery && !isLocalSession(activeSessionFromQuery)) {
          await loadBackendConversations();
          await loadConversationMessages(activeSessionFromQuery);
          return;
        }

        loadLocalConversations();
        if (activeSessionFromQuery !== null) {
          loadLocalConversationMessages(activeSessionFromQuery);
        }
      } catch {
        setIsAuthenticated(false);
        setUsername(null);
        setUserId(null);
        setSaveHistory(false);
        loadLocalConversations();
        if (activeSessionFromQuery !== null) {
          loadLocalConversationMessages(activeSessionFromQuery);
        }
      }
    };
    init();
  }, [activeSessionFromQuery, loadConversationMessages, loadBackendConversations, loadLocalConversationMessages, loadLocalConversations]);

  useEffect(() => {
    if (!isAuthenticated) return;
    persistSaveHistoryPreference(saveHistory);
  }, [isAuthenticated, saveHistory]);

  useEffect(() => {
    if (historyMode === 'account') {
      loadBackendConversations();
      return;
    }
    loadLocalConversations();
  }, [historyMode, loadBackendConversations, loadLocalConversations]);

  useEffect(() => {
    if (activeSessionFromQuery === null || activeSessionFromQuery === activeSessionId) {
      return;
    }

    if (historyMode === 'local' || isLocalSession(activeSessionFromQuery)) {
      loadLocalConversationMessages(activeSessionFromQuery);
      return;
    }

    loadConversationMessages(activeSessionFromQuery);
  }, [activeSessionFromQuery, activeSessionId, historyMode, loadConversationMessages, loadLocalConversationMessages]);

  useEffect(() => {
    if (activeSessionId == null) return;
    if (historyMode !== 'local' && !isLocalSession(activeSessionId)) return;
    persistLocalConversation(activeSessionId, messages);
    loadLocalConversations();
  }, [activeSessionId, historyMode, loadLocalConversations, messages]);

  const handleNewConversation = useCallback(() => {
    setMessages([{ role: 'assistant', content: '新的对话已开始。你现在最想先聊哪一件事？' }]);
    setActiveSessionId(null);
    setCrisisAlert(null);
    router.replace('/');
  }, [router]);

  const handleSelectConversation = useCallback(
    (sessionId: number) => {
      router.replace(`/?session=${sessionId}`);
      const restoredLocalMessages = readLocalConversationMessages(sessionId);
      if (restoredLocalMessages?.length) {
        loadLocalConversationMessages(sessionId);
        return;
      }
      loadConversationMessages(sessionId);
    },
    [loadConversationMessages, loadLocalConversationMessages, router]
  );

  const handleFeedback = useCallback(async (messageId: number, feedback: 'up' | 'down') => {
    try {
      await sendMessageFeedback(messageId, feedback);
      setMessages((prev) => prev.map((item) => (item.id === messageId ? { ...item, feedback } : item)));
    } catch {
      // Feedback failures should not block the chat flow.
    }
  }, []);

  const sendMessage = useCallback(
    async (rawInput: string) => {
      if (!rawInput.trim() || isLoading) return;

      const userMsg = rawInput.trim();
      const anonymousMode = !isAuthenticated || !saveHistory;
      setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
      setIsLoading(true);

      try {
        if (useAgent) {
          const data = await agentChat({
            message: userMsg,
            session_id: activeSessionId,
            user_id: userId,
            anonymous: anonymousMode,
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
          if (anonymousMode || isLocalSession(data.session_id ?? null)) {
            loadLocalConversations();
          } else if (isAuthenticated) {
            loadBackendConversations();
          }
        } else {
          const data = await chatWithAI({
            message: userMsg,
            session_id: activeSessionId,
            anonymous: anonymousMode,
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
          if (anonymousMode || isLocalSession(data.session_id ?? null)) {
            loadLocalConversations();
          } else if (isAuthenticated) {
            loadBackendConversations();
          }
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: (error as Error).message || '连接 AI 服务失败，请检查后端是否已启动。',
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, isAuthenticated, isLoading, loadBackendConversations, loadLocalConversations, router, saveHistory, searchMode, useAgent, useThinking, userId]
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
    historyMode,
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
