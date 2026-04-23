import { History, Loader2, MessageSquare, Plus, Trash2, X } from 'lucide-react';

interface ChatSidebarProps {
  isAuthenticated: boolean;
  username: string | null;
  conversations: Array<{ id: number; title: string }>;
  activeSessionId: number | null;
  historyMode: 'account' | 'local';
  isCreatingConversation: boolean;
  isConversationListLoading: boolean;
  deletingConversationId: number | null;
  onClose?: () => void;
  onNewConversation: () => void | Promise<void>;
  onSelectConversation: (sessionId: number) => void | Promise<void>;
  onDeleteConversation: (sessionId: number) => void | Promise<void>;
  className?: string;
}

export default function ChatSidebar({
  isAuthenticated,
  username,
  conversations,
  activeSessionId,
  historyMode,
  isCreatingConversation,
  isConversationListLoading,
  deletingConversationId,
  onClose,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  className = '',
}: ChatSidebarProps) {
  const isAccountMode = historyMode === 'account';

  return (
    <aside
      className={`h-full w-40 shrink-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,250,249,0.92))] p-3 backdrop-blur ${className}`}
    >
      <div className="rounded-[1.4rem] bg-white/86 p-3 shadow-[0_14px_30px_rgba(86,126,134,0.08)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6ca7a3,#5d83a0)] text-[11px] font-semibold text-white">
                P
              </span>
              <p className="text-sm font-semibold text-slate-800">会话</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">{isAccountMode ? '账号历史' : '本地历史'}</p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex min-w-[3.25rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium leading-none ${
                isAccountMode ? 'bg-[#e7f1f1] text-[#406f76]' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isAccountMode ? '已保存' : '临时'}
            </span>
            {!!onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 md:hidden"
                aria-label="关闭会话面板"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onNewConversation()}
          disabled={isCreatingConversation}
          className="mist-primary-button mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium disabled:opacity-60"
        >
          {isCreatingConversation ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {isCreatingConversation ? '创建中...' : '新对话'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
        {isAccountMode ? <History size={13} /> : <MessageSquare size={13} />}
        <span>{isAccountMode ? '历史记录' : '本地记录'}</span>
      </div>

      <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
        {isConversationListLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-[1.2rem] bg-white/78 px-3 py-3 shadow-[0_10px_24px_rgba(86,126,134,0.06)]"
              >
                <div className="h-2 w-10 rounded-full bg-slate-100" />
                <div className="mt-3 h-2 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-2 w-3/4 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-[1.2rem] bg-white/72 p-3 text-[11px] leading-5 text-slate-400 shadow-[0_10px_24px_rgba(86,126,134,0.06)]">
            {isAccountMode
              ? '这里暂时还没有账号历史。你可以先开始一次新的倾诉，完成后会自动出现在这里。'
              : '这里还没有本地会话。点击上方按钮，可以立即开始新的对话。'}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeSessionId;
            const isDeleting = deletingConversationId === conv.id;

            return (
              <div
                key={conv.id}
                className={`rounded-[1.25rem] text-left text-xs transition ${
                  isActive
                    ? 'bg-[linear-gradient(180deg,#eff8f7_0%,#e6f3f1_100%)] text-[#406f76] shadow-[0_10px_24px_rgba(86,126,134,0.1)]'
                    : 'bg-white/74 text-slate-600 shadow-[0_10px_24px_rgba(86,126,134,0.06)] hover:bg-white/92'
                }`}
              >
                <div className="flex items-start gap-2 px-2.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => void onSelectConversation(conv.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? 'bg-[#5f9a96]' : 'bg-slate-200'}`} />
                      {isActive && (
                        <span className="rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] text-[#4b807c]">当前</span>
                      )}
                    </div>
                    <div className="mt-2 line-clamp-3 leading-5">{conv.title || '未命名对话'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDeleteConversation(conv.id)}
                    disabled={isDeleting}
                    aria-label={`删除对话 ${conv.title || '未命名对话'}`}
                    className="mt-0.5 rounded-full p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 rounded-[1.2rem] bg-white/78 px-3 py-2 text-[11px] text-slate-500 shadow-[0_10px_24px_rgba(86,126,134,0.06)]">
        <div className="font-medium text-slate-700">{isAuthenticated ? username || '用户' : '游客模式'}</div>
        <div className="mt-1 text-[10px] text-slate-400">{isAccountMode ? '历史已同步' : '仅本机可见'}</div>
      </div>
    </aside>
  );
}
