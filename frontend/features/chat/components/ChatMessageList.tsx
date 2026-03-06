import Link from 'next/link';
import { Bot, Loader2, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import type { Message } from '../types';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  onFeedback: (messageId: number, feedback: 'up' | 'down') => void;
}

export default function ChatMessageList({ messages, isLoading, onFeedback }: ChatMessageListProps) {
  return (
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
                onClick={() => onFeedback(msg.id!, 'up')}
                className={`rounded p-1 ${msg.feedback === 'up' ? 'bg-green-100 text-green-700' : 'hover:bg-slate-100'}`}
              >
                <ThumbsUp size={14} />
              </button>
              <button
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Loader2 className="animate-spin text-slate-400" size={16} />
        </div>
      )}
    </div>
  );
}
