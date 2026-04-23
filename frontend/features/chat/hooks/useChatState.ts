import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  agentChat,
  chatWithAI,
  createConversation,
  deleteConversation,
  getConversationMessages,
  getMe,
  listConversations,
  sendMessageFeedback,
} from '@/lib/api';
import type { CrisisAlert, Message } from '../types';

type ConversationMode = 'account' | 'local';
type ConversationSummary = {
  id: number;
  title: string;
};
type StoredConversationSummary = ConversationSummary & {
  updated_at: string;
};

const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: 'assistant',
  content: '你好，我是 PsySight。谢谢你愿意来到这里。你可以从最近最困扰你的一件小事开始说，我会认真听。',
};

const DEFAULT_CONVERSATION_TITLE = '新的对话';
const LOCAL_CONVERSATION_INDEX_KEY = 'psysight_chat_local_conversations_v1';
const LOCAL_CONVERSATION_MESSAGES_PREFIX = 'psysight_chat_local_messages_';
const SAVE_HISTORY_PREF_KEY = 'psysight_chat_save_history_v1';

const isLocalSession = (sessionId: number | null | undefined): sessionId is number =>
  typeof sessionId === 'number' && sessionId < 0;

const getConversationModeFromSession = (
  sessionId: number | null | undefined,
  isAuthenticated: boolean
): ConversationMode | null => {
  if (isLocalSession(sessionId)) return 'local';
  if (typeof sessionId === 'number' && sessionId > 0 && isAuthenticated) return 'account';
  return null;
};

const getLocalMessagesKey = (sessionId: number) => `${LOCAL_CONVERSATION_MESSAGES_PREFIX}${sessionId}`;

const getDefaultMessages = (): Message[] => [{ ...INITIAL_ASSISTANT_MESSAGE }];

const createLocalDraftSessionId = () => -(Date.now() + Math.floor(Math.random() * 1000));

const isDraftConversationTitle = (title: string | null | undefined) =>
  (title || '').trim() === DEFAULT_CONVERSATION_TITLE;

const getExistingDraftConversation = (items: ConversationSummary[]) =>
  items.find((item) => isDraftConversationTitle(item.title)) ?? null;

const truncateTitle = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return DEFAULT_CONVERSATION_TITLE;
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

const persistStoredLocalConversationIndex = (items: StoredConversationSummary[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_CONVERSATION_INDEX_KEY, JSON.stringify(items));
  } catch {
    // Ignore local persistence failures.
  }
};

const deleteStoredLocalConversation = (sessionId: number) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getLocalMessagesKey(sessionId));
    const nextIndex = readStoredLocalConversationIndex().filter((item) => item.id !== sessionId);
    persistStoredLocalConversationIndex(nextIndex);
  } catch {
    // Ignore local persistence failures.
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

const readLocalConversationIndex = (): ConversationSummary[] =>
  readStoredLocalConversationIndex()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((item) => ({ id: item.id, title: item.title }));

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
    persistStoredLocalConversationIndex(merged);
  } catch {
    // Ignore local persistence failures.
  }
};

const upsertConversation = (items: ConversationSummary[], nextItem: ConversationSummary) => [
  nextItem,
  ...items.filter((item) => item.id !== nextItem.id),
];

export function useChatState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>(getDefaultMessages);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [accountConversations, setAccountConversations] = useState<ConversationSummary[]>([]);
  const [localConversations, setLocalConversations] = useState<ConversationSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [saveHistory, setSaveHistory] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isConversationListLoading, setIsConversationListLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
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

  const preferredMode = useMemo<ConversationMode>(
    () => (isAuthenticated && saveHistory ? 'account' : 'local'),
    [isAuthenticated, saveHistory]
  );

  const activeConversationMode = useMemo(
    () => getConversationModeFromSession(activeSessionId, isAuthenticated),
    [activeSessionId, isAuthenticated]
  );

  const historyMode = useMemo<ConversationMode>(
    () => activeConversationMode ?? preferredMode,
    [activeConversationMode, preferredMode]
  );

  const conversations = useMemo(
    () => (historyMode === 'account' ? accountConversations : localConversations),
    [accountConversations, historyMode, localConversations]
  );

  const resetConversationView = useCallback(() => {
    setMessages(getDefaultMessages());
    setActiveSessionId(null);
    setCrisisAlert(null);
    setConversationError(null);
    setIsSessionLoading(false);
    router.replace('/chat');
  }, [router]);

  const loadBackendConversations = useCallback(
    async (options?: { silent?: boolean; enabled?: boolean }) => {
      const silent = options?.silent ?? false;
      const enabled = options?.enabled ?? isAuthenticated;

      if (!silent) {
        setIsConversationListLoading(true);
      }

      if (!enabled) {
        setAccountConversations([]);
        if (!silent) {
          setIsConversationListLoading(false);
        }
        return;
      }

      try {
        const response = await listConversations();
        setAccountConversations(response.items.map((item) => ({ id: item.id, title: item.title })));
      } catch {
        setAccountConversations([]);
      } finally {
        if (!silent) {
          setIsConversationListLoading(false);
        }
      }
    },
    [isAuthenticated]
  );

  const loadLocalConversations = useCallback(() => {
    setLocalConversations(readLocalConversationIndex());
  }, []);

  const loadLocalConversationMessages = useCallback((sessionId: number) => {
    const restored = readLocalConversationMessages(sessionId);
    setMessages(restored?.length ? restored : getDefaultMessages());
    setActiveSessionId(sessionId);
    setCrisisAlert(null);
    setConversationError(null);
    setIsSessionLoading(false);
    return true;
  }, []);

  const loadConversationMessages = useCallback(async (sessionId: number, showLoading = true) => {
    if (showLoading) {
      setIsSessionLoading(true);
      setMessages([]);
    }

    setConversationError(null);

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
      setMessages(mapped.length ? mapped : [{ role: 'assistant', content: '这个会话还没有内容，我们现在开始吧。' }]);
      setActiveSessionId(sessionId);
      setCrisisAlert(null);
      return true;
    } catch {
      setMessages([]);
      setConversationError('当前会话暂时无法加载，你可以重新尝试，或先切换到其他会话。');
      return false;
    } finally {
      if (showLoading) {
        setIsSessionLoading(false);
      }
    }
  }, []);

  const focusConversation = useCallback(
    async (sessionId: number) => {
      if (isLocalSession(sessionId)) {
        loadLocalConversationMessages(sessionId);
        router.replace(`/chat?session=${sessionId}`);
        return true;
      }

      if (!isAuthenticated) {
        return false;
      }

      const loaded = await loadConversationMessages(sessionId, true);
      if (loaded) {
        router.replace(`/chat?session=${sessionId}`);
      }
      return loaded;
    },
    [isAuthenticated, loadConversationMessages, loadLocalConversationMessages, router]
  );

  useEffect(() => {
    const init = async () => {
      setIsConversationListLoading(true);
      loadLocalConversations();

      try {
        const me = await getMe();
        const authenticated = me.authenticated;
        const preferredSaveHistory = authenticated ? readSaveHistoryPreference(true) : false;

        setIsAuthenticated(authenticated);
        setUsername(me.user?.username || null);
        setUserId(me.user?.id || null);
        setSaveHistory(preferredSaveHistory);

        await loadBackendConversations({ silent: true, enabled: authenticated });

        if (activeSessionFromQuery == null) {
          return;
        }

        if (isLocalSession(activeSessionFromQuery)) {
          loadLocalConversationMessages(activeSessionFromQuery);
          return;
        }

        if (!authenticated) {
          resetConversationView();
          return;
        }

        const loaded = await loadConversationMessages(activeSessionFromQuery, true);
        if (!loaded) {
          router.replace(`/chat?session=${activeSessionFromQuery}`);
        }
      } catch {
        setIsAuthenticated(false);
        setUsername(null);
        setUserId(null);
        setSaveHistory(false);
        setAccountConversations([]);

        if (activeSessionFromQuery !== null && isLocalSession(activeSessionFromQuery)) {
          loadLocalConversationMessages(activeSessionFromQuery);
          return;
        }

        if (activeSessionFromQuery !== null) {
          resetConversationView();
        }
      } finally {
        setIsConversationListLoading(false);
        setIsInitialized(true);
      }
    };

    void init();
  }, [activeSessionFromQuery, loadBackendConversations, loadConversationMessages, loadLocalConversationMessages, loadLocalConversations, resetConversationView, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    persistSaveHistoryPreference(saveHistory);
  }, [isAuthenticated, saveHistory]);

  useEffect(() => {
    if (historyMode === 'account') {
      void loadBackendConversations({ silent: true });
      return;
    }
    loadLocalConversations();
  }, [historyMode, loadBackendConversations, loadLocalConversations]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (activeSessionFromQuery === null || activeSessionFromQuery === activeSessionId) {
      return;
    }

    if (isLocalSession(activeSessionFromQuery)) {
      loadLocalConversationMessages(activeSessionFromQuery);
      return;
    }

    if (!isAuthenticated) {
      resetConversationView();
      return;
    }

    void loadConversationMessages(activeSessionFromQuery, true).then((loaded) => {
      if (!loaded) {
        router.replace(`/chat?session=${activeSessionFromQuery}`);
      }
    });
  }, [
    activeSessionFromQuery,
    activeSessionId,
    isAuthenticated,
    isInitialized,
    loadConversationMessages,
    loadLocalConversationMessages,
    resetConversationView,
    router,
  ]);

  useEffect(() => {
    if (activeSessionId == null || !isLocalSession(activeSessionId)) return;
    persistLocalConversation(activeSessionId, messages);
    loadLocalConversations();
  }, [activeSessionId, loadLocalConversations, messages]);

  const beginLocalConversation = useCallback(() => {
    const sessionId = createLocalDraftSessionId();
    setMessages([{ role: 'assistant', content: '新的对话已经开始。你现在最想先聊哪一件事？' }]);
    setActiveSessionId(sessionId);
    setCrisisAlert(null);
    setConversationError(null);
    setLocalConversations((prev) => upsertConversation(prev, { id: sessionId, title: DEFAULT_CONVERSATION_TITLE }));
    router.replace(`/chat?session=${sessionId}`);
    return sessionId;
  }, [router]);

  const handleNewConversation = useCallback(async () => {
    setCrisisAlert(null);
    setConversationError(null);

    if (preferredMode === 'account') {
      const existingDraft = getExistingDraftConversation(accountConversations);
      if (existingDraft) {
        await focusConversation(existingDraft.id);
        return;
      }

      setIsCreatingConversation(true);
      try {
        const created = await createConversation(DEFAULT_CONVERSATION_TITLE);
        setMessages([{ role: 'assistant', content: '新的对话已经开始。你现在最想先聊哪一件事？' }]);
        setActiveSessionId(created.id);
        setAccountConversations((prev) =>
          upsertConversation(prev, { id: created.id, title: created.title || DEFAULT_CONVERSATION_TITLE })
        );
        router.replace(`/chat?session=${created.id}`);
        await loadBackendConversations({ silent: true });
      } catch {
        setMessages([{ role: 'assistant', content: '新对话创建失败，请稍后重试。', isError: true }]);
      } finally {
        setIsCreatingConversation(false);
      }
      return;
    }

    const existingDraft = getExistingDraftConversation(localConversations);
    if (existingDraft) {
      await focusConversation(existingDraft.id);
      return;
    }

    beginLocalConversation();
  }, [accountConversations, beginLocalConversation, focusConversation, loadBackendConversations, localConversations, preferredMode, router]);

  const handleSelectConversation = useCallback(
    async (sessionId: number) => {
      await focusConversation(sessionId);
    },
    [focusConversation]
  );

  const retryActiveConversation = useCallback(() => {
    if (activeSessionId == null) {
      resetConversationView();
      return;
    }

    if (isLocalSession(activeSessionId)) {
      loadLocalConversationMessages(activeSessionId);
      return;
    }

    void loadConversationMessages(activeSessionId, true);
  }, [activeSessionId, loadConversationMessages, loadLocalConversationMessages, resetConversationView]);

  const handleDeleteConversation = useCallback(
    async (sessionId: number) => {
      const targetConversation =
        accountConversations.find((item) => item.id === sessionId) ??
        localConversations.find((item) => item.id === sessionId);
      const displayTitle = targetConversation?.title || DEFAULT_CONVERSATION_TITLE;

      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(`确认删除“${displayTitle}”吗？删除后不能恢复。`);
        if (!confirmed) {
          return;
        }
      }

      const deletingMode: ConversationMode = isLocalSession(sessionId) ? 'local' : 'account';
      const nextLocalConversations =
        deletingMode === 'local' ? localConversations.filter((item) => item.id !== sessionId) : localConversations;
      const nextAccountConversations =
        deletingMode === 'account'
          ? accountConversations.filter((item) => item.id !== sessionId)
          : accountConversations;

      setDeletingConversationId(sessionId);
      try {
        if (deletingMode === 'local') {
          deleteStoredLocalConversation(sessionId);
          setLocalConversations(nextLocalConversations);
        } else {
          await deleteConversation(sessionId);
          setAccountConversations(nextAccountConversations);
        }

        if (activeSessionId === sessionId) {
          const preferredFallback =
            preferredMode === 'account' ? nextAccountConversations[0] ?? null : nextLocalConversations[0] ?? null;
          const sameModeFallback =
            deletingMode === 'account' ? nextAccountConversations[0] ?? null : nextLocalConversations[0] ?? null;
          const fallback = preferredFallback ?? sameModeFallback;

          if (fallback) {
            await focusConversation(fallback.id);
          } else {
            resetConversationView();
          }
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.alert('删除会话失败，请稍后重试。');
        }
      } finally {
        setDeletingConversationId(null);
      }
    },
    [accountConversations, activeSessionId, focusConversation, localConversations, preferredMode, resetConversationView]
  );

  const handleSaveHistoryChange = useCallback(
    (checked: boolean) => {
      setSaveHistory(checked);
      setConversationError(null);

      if (!isAuthenticated) {
        return;
      }

      if (checked) {
        void loadBackendConversations({ silent: true });
        return;
      }

      loadLocalConversations();
    },
    [isAuthenticated, loadBackendConversations, loadLocalConversations]
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
      const conversationMode = activeConversationMode ?? preferredMode;
      const anonymousMode = conversationMode === 'local';

      let sessionId =
        conversationMode === 'account'
          ? activeSessionId
          : isLocalSession(activeSessionId)
            ? activeSessionId
            : null;

      if (conversationMode === 'local' && !isLocalSession(sessionId)) {
        sessionId = beginLocalConversation();
      }

      setConversationError(null);
      setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
      setIsLoading(true);

      try {
        if (useAgent) {
          const data = await agentChat({
            message: userMsg,
            session_id: sessionId,
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

          if (conversationMode === 'account' && data.session_id && data.session_id !== activeSessionId) {
            setActiveSessionId(data.session_id);
            router.replace(`/chat?session=${data.session_id}`);
          }

          setMessages((prev) => [...prev, assistantMsg]);

          if (conversationMode === 'local') {
            loadLocalConversations();
          } else {
            await loadBackendConversations({ silent: true });
          }
        } else {
          const data = await chatWithAI({
            message: userMsg,
            session_id: sessionId,
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

          if (conversationMode === 'account' && data.session_id && data.session_id !== activeSessionId) {
            setActiveSessionId(data.session_id);
            router.replace(`/chat?session=${data.session_id}`);
          }

          setMessages((prev) => [...prev, assistantMsg]);

          if (conversationMode === 'local') {
            loadLocalConversations();
          } else {
            await loadBackendConversations({ silent: true });
          }
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: (error as Error).message || '连接 AI 服务失败，请检查后端是否已经启动。',
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeConversationMode,
      activeSessionId,
      beginLocalConversation,
      isLoading,
      loadBackendConversations,
      loadLocalConversations,
      preferredMode,
      router,
      searchMode,
      useAgent,
      useThinking,
      userId,
    ]
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
  };
}
