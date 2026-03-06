import Link from 'next/link';
import { Plus } from 'lucide-react';

interface ChatSidebarProps {
  isAuthenticated: boolean;
  username: string | null;
  conversations: Array<{ id: number; title: string }>;
  activeSessionId: number | null;
  onNewConversation: () => void;
  onSelectConversation: (sessionId: number) => void;
}

export default function ChatSidebar({
  isAuthenticated,
  username,
  conversations,
  activeSessionId,
  onNewConversation,
  onSelectConversation,
}: ChatSidebarProps) {
  return (
    <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white/90 backdrop-blur-sm p-4 flex-col">
      <button
        onClick={onNewConversation}
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
            {conversations.length === 0 && <div className="text-xs text-slate-400">暂无历史会话</div>}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm ${
                  conv.id === activeSessionId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'
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
  );
}
