import { MessageSquare } from 'lucide-react';

interface ChatTopBarProps {
  networkOnline: boolean;
  isAuthenticated: boolean;
  saveHistory: boolean;
  onToggleSaveHistory: (checked: boolean) => void;
}

export default function ChatTopBar({
  networkOnline,
  isAuthenticated,
  saveHistory,
  onToggleSaveHistory,
}: ChatTopBarProps) {
  return (
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
                onChange={(event) => onToggleSaveHistory(event.target.checked)}
              />
              保存历史
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
