import Link from 'next/link';
import { AlertCircle, Bot, Loader2, MessageSquare, RefreshCcw, ThumbsDown, ThumbsUp, User } from 'lucide-react';

import StatePanel from '@/components/StatePanel';

import type { Message } from '../types';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isConversationLoading: boolean;
  conversationError: string | null;
  activeSessionId: number | null;
  onFeedback: (messageId: number, feedback: 'up' | 'down') => void;
  onRetryConversation: () => void;
}

const withSessionQuery = (href: string, sessionId: number | null) => {
  if (sessionId == null) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}session=${encodeURIComponent(String(sessionId))}`;
};

const formatScaleMeta = (scale: NonNullable<Message['recommended_scales']>[number]) =>
  [
    scale.question_count ? `${scale.question_count} 题` : null,
    scale.assessment_depth === 'brief'
      ? '快速筛查'
      : scale.assessment_depth === 'deep'
        ? '完整评估'
        : scale.assessment_depth
          ? '中等深度'
          : null,
    scale.reason || null,
  ]
    .filter(Boolean)
    .join(' · ');

export default function ChatMessageList({
  messages,
  isLoading,
  isConversationLoading,
  conversationError,
  activeSessionId,
  onFeedback,
  onRetryConversation,
}: ChatMessageListProps) {
  if (isConversationLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3.5 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`rounded-[1.5rem] border border-white/75 bg-white/82 p-3.5 shadow-[0_12px_36px_rgba(86,126,134,0.08)] sm:p-4 ${
              item === 1 ? 'ml-4 sm:ml-10' : ''
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded-full bg-slate-200" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 rounded-full bg-slate-100" />
              <div className="h-3 w-2/3 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversationError) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-6">
        <StatePanel
          icon={<AlertCircle size={18} />}
          title="会话加载失败"
          description={conversationError}
          tone="danger"
          actions={
            <button
              type="button"
              onClick={onRetryConversation}
              className="mist-primary-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
            >
              <RefreshCcw size={14} />
              重新加载
            </button>
          }
        />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-6">
        <StatePanel
          icon={<MessageSquare size={18} />}
          title="当前还没有消息"
          description="可以从最近困扰你的事情开始聊，或者先选择一个历史对话继续。"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3.5 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4">
      {messages.map((msg, idx) => (
        <div
          key={`${idx}-${msg.id || 'new'}`}
          className={`rounded-[1.5rem] border p-3.5 shadow-[0_12px_36px_rgba(86,126,134,0.08)] sm:p-4 ${
            msg.isError ? 'border-rose-200 bg-rose-50/90' : 'border-white/75 bg-white/82'
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            <span>{msg.role === 'assistant' ? 'PsySight' : '你'}</span>
            {msg.isError && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">异常</span>
            )}
          </div>

          <p className={`whitespace-pre-wrap text-sm leading-7 ${msg.isError ? 'text-rose-700' : 'text-slate-700'}`}>
            {msg.content}
          </p>

          {msg.recommended_scale && (
            <div className="mt-3 rounded-[1.25rem] border border-[#d9ebe7] bg-[#f3f9f8] p-3 sm:p-3.5">
              <p className="text-xs font-medium text-[#4f7d83]">推荐量表</p>
              <p className="mt-1 text-sm text-slate-800">{msg.recommended_scale.title}</p>
              <Link
                href={withSessionQuery(`/scale/${msg.recommended_scale.id}`, activeSessionId)}
                className="mist-primary-button mt-2 inline-flex w-full justify-center rounded-full px-3 py-1.5 text-xs font-semibold sm:w-auto"
              >
                一键开始测评
              </Link>
            </div>
          )}

          {msg.recommended_scales && msg.recommended_scales.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-[#4f7d83]">推荐量表</p>
              {msg.recommended_scales.map((scale) => (
                <div
                  key={scale.code}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-[#d9ebe7] bg-[#f3f9f8] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 pr-0 sm:pr-3">
                    <div className="text-sm text-slate-800">{scale.title}</div>
                    {(scale.question_count || scale.assessment_depth || scale.reason) && (
                      <div className="mt-1 text-xs text-slate-500">{formatScaleMeta(scale)}</div>
                    )}
                  </div>
                  <Link
                    href={withSessionQuery(
                      scale.scale_id
                        ? `/scale/${scale.scale_id}`
                        : scale.code
                          ? `/scale-code/${encodeURIComponent(scale.code)}`
                          : '/scales',
                      activeSessionId
                    )}
                    className="mist-primary-button inline-flex w-full justify-center rounded-full px-3 py-1.5 text-xs font-semibold sm:w-auto"
                  >
                    开始测评
                  </Link>
                </div>
              ))}
            </div>
          )}

          {msg.role === 'assistant' && msg.id && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>这条回复对你有帮助吗？</span>
              <button
                type="button"
                onClick={() => onFeedback(msg.id!, 'up')}
                className={`rounded p-1 ${msg.feedback === 'up' ? 'bg-green-100 text-green-700' : 'hover:bg-slate-100'}`}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => onFeedback(msg.id!, 'down')}
                className={`rounded p-1 ${msg.feedback === 'down' ? 'bg-rose-100 text-rose-700' : 'hover:bg-slate-100'}`}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="rounded-[1.5rem] border border-white/75 bg-white/82 p-3.5 shadow-[0_12px_36px_rgba(86,126,134,0.08)] sm:p-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="animate-spin text-slate-400" size={16} />
            <span>正在生成回复...</span>
          </div>
        </div>
      )}
    </div>
  );
}
