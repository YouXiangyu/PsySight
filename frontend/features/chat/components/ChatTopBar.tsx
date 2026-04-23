import Link from 'next/link';
import { MenuSquare, MessageSquare } from 'lucide-react';

interface ChatTopBarProps {
  networkOnline: boolean;
  isAuthenticated: boolean;
  saveHistory: boolean;
  onToggleSaveHistory: (checked: boolean) => void;
  onOpenSidebar: () => void;
}

export default function ChatTopBar({
  networkOnline,
  isAuthenticated,
  saveHistory,
  onToggleSaveHistory,
  onOpenSidebar,
}: ChatTopBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-white/70 bg-white/72 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-white md:hidden"
          >
            <MenuSquare size={15} />
            会话列表
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2 text-sm text-slate-600 transition hover:text-[#406f76]">
            <MessageSquare size={16} className="shrink-0" />
            <span className="truncate">PsySight 倾诉空间</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs md:justify-end">
          {!networkOnline && <span className="basis-full text-amber-600 md:basis-auto">网络已断开，内容会先暂存</span>}
          {isAuthenticated && (
            <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/75 bg-white/78 px-3 py-1.5 text-slate-600 shadow-[0_8px_24px_rgba(86,126,134,0.08)]">
              <input
                type="checkbox"
                checked={saveHistory}
                onChange={(event) => onToggleSaveHistory(event.target.checked)}
                className="shrink-0"
              />
              <span className="whitespace-nowrap leading-none">新对话保存历史</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
