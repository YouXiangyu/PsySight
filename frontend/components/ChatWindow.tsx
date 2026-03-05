'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import {
  chatWithAI,
  getConversationMessages,
  getMe,
  listConversations,
  sendMessageFeedback,
} from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  recommended_scale?: {
    id: number;
    code?: string;
    title: string;
  };
  feedback?: 'up' | 'down';
  isError?: boolean;
}

interface CrisisAlert {
  show: boolean;
  keywords: string[];
  hotlines: Array<{ name: string; phone: string }>;
  message: string;
  persistent: boolean;
}

const DRAFT_KEY = 'psysight_chat_draft_v1';

export default function ChatWindow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '你好，我是 PsySight。谢谢你愿意来到这里。你可以从最近最困扰你的一件小事开始说，我会认真听。',
    },
  ]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: number; title: string }>>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [saveHistory, setSaveHistory] = useState(true);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const cached = localStorage.getItem(DRAFT_KEY);
    if (cached) {
      setInput(cached);
    }
    setNetworkOnline(window.navigator.onLine);
    const onOnline = () => setNetworkOnline(true);
    const onOffline = () => setNetworkOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, input);
  }, [input]);

  const activeSessionFromQuery = useMemo(() => {
    const value = searchParams.get('session');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const loadConversations = async () => {
    try {
      const response = await listConversations();
      setConversations(response.items.map((item) => ({ id: item.id, title: item.title })));
    } catch {
      setConversations([]);
    }
  };

  const loadConversationMessages = async (sessionId: number) => {
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
      setMessages(
        mapped.length
          ? mapped
          : [{ role: 'assistant', content: '这个会话还没有消息，我们从现在开始吧。' }]
      );
      setActiveSessionId(sessionId);
    } catch {
      setMessages([{ role: 'assistant', content: '会话加载失败，请稍后重试。', isError: true }]);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await getMe();
        setIsAuthenticated(me.authenticated);
        setUsername(me.user?.username || null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeSessionFromQuery && activeSessionFromQuery !== activeSessionId) {
      loadConversationMessages(activeSessionFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionFromQuery, isAuthenticated]);

  const handleNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: '新的对话已开始。你现在最想先聊哪一件事？',
      },
    ]);
    setActiveSessionId(null);
    setCrisisAlert(null);
    router.replace('/');
  };

  const handleFeedback = async (messageId: number, feedback: 'up' | 'down') => {
    try {
      await sendMessageFeedback(messageId, feedback);
      setMessages((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, feedback } : item))
      );
    } catch {
      // 反馈失败不阻塞聊天
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
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
      setMessages(prev => [...prev, assistantMsg]);
      if (isAuthenticated) {
        loadConversations();
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: (error as Error).message || '连接 AI 服务失败。请检查后端是否启动。',
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#f7f8fb]">
      <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white/90 backdrop-blur-sm p-4 flex-col">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <Plus size={16} />
          开启新对话
        </button>
        {!isAuthenticated ? (
          <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
            登录后可保存历史与恢复上下文。
            <Link href="/auth" className="block mt-2 font-semibold underline">
              去登录/注册
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 text-xs text-slate-400">历史对话</div>
            <div className="mt-2 space-y-2 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="text-xs text-slate-400">暂无历史会话</div>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveSessionId(conv.id);
                    router.replace(`/?session=${conv.id}`);
                    loadConversationMessages(conv.id);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm ${
                    conv.id === activeSessionId
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {conv.title}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="mt-auto border-t border-slate-200 pt-3 text-xs text-slate-500">
          {isAuthenticated ? `已登录：${username || '用户'}` : '匿名模式'}
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col h-full">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm p-3">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MessageSquare size={16} />
              <span>PsySight 倾诉空间</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {!networkOnline && <span className="text-amber-600">网络已断开，内容已暂存</span>}
              {isAuthenticated && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={saveHistory}
                    onChange={(event) => setSaveHistory(event.target.checked)}
                  />
                  保存历史
                </label>
              )}
            </div>
          </div>
        </div>

        {crisisAlert?.show && (
          <div className="mx-auto mt-3 w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} />
              紧急支持提醒
            </div>
            <p className="mt-2">{crisisAlert.message}</p>
            <ul className="mt-2 space-y-1">
              {crisisAlert.hotlines.map((item) => (
                <li key={item.phone}>
                  {item.name}: <a className="font-semibold underline" href={`tel:${item.phone}`}>{item.phone}</a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">危机提醒在当前会话内持续显示，结束会话后会清除。</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto w-full pb-32" ref={scrollRef}>
          <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={`${idx}-${msg.id || 'new'}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  <span>{msg.role === 'assistant' ? 'PsySight' : '你'}</span>
                </div>
                <p className={`whitespace-pre-wrap text-sm leading-7 ${msg.isError ? 'text-red-600' : 'text-slate-700'}`}>
                  {msg.content}
                </p>

                {msg.recommended_scale && (
                  <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                    <p className="text-xs text-indigo-700 font-medium">推荐量表</p>
                    <p className="text-sm mt-1 text-indigo-900">{msg.recommended_scale.title}</p>
                    <Link
                      href={`/scale/${msg.recommended_scale.id}`}
                      className="mt-2 inline-flex rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      一键开始测评
                    </Link>
                  </div>
                )}

                {msg.role === 'assistant' && msg.id && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span>这条回复有帮助吗？</span>
                    <button
                      onClick={() => handleFeedback(msg.id!, 'up')}
                      className={`rounded p-1 ${msg.feedback === 'up' ? 'bg-green-100 text-green-700' : 'hover:bg-slate-100'}`}
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id!, 'down')}
                      className={`rounded p-1 ${msg.feedback === 'down' ? 'bg-rose-100 text-rose-700' : 'hover:bg-slate-100'}`}
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Loader2 className="animate-spin text-slate-400" size={16} />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#f7f8fb] via-[#f7f8fb] to-transparent pt-10 pb-4 px-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="把想说的话慢慢打下来..."
                className="min-h-[28px] max-h-[180px] flex-1 resize-none border-none bg-transparent px-2 py-1 text-sm text-slate-700 outline-none"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`rounded-md p-2 ${
                  input.trim() && !isLoading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              本系统用于心理支持与自助筛查，不作为医疗诊断依据。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
