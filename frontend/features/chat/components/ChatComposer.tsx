import { Brain, Search, Send } from 'lucide-react';

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  useThinking: boolean;
  searchMode: 'index' | 'rag';
  useAgent: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleThinking: () => void;
  onToggleSearchMode: () => void;
  onToggleAgent: () => void;
}

export default function ChatComposer({
  input,
  isLoading,
  useThinking,
  searchMode,
  useAgent,
  onChange,
  onSend,
  onToggleThinking,
  onToggleSearchMode,
}: ChatComposerProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {useAgent && (
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          <button
            onClick={onToggleThinking}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              useThinking
                ? 'bg-[#e7f1f1] text-[#406f76] ring-1 ring-[#c6dfdc]'
                : 'bg-white/75 text-slate-500 hover:bg-white'
            }`}
            title={useThinking ? '深度思考模式（更慢、更深入）' : '快速模式（更快响应）'}
          >
            <Brain size={13} />
            <span className="whitespace-nowrap">{useThinking ? '深度思考' : '快速回答'}</span>
          </button>
          <button
            onClick={onToggleSearchMode}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              searchMode === 'rag'
                ? 'bg-[#e7f1f1] text-[#406f76] ring-1 ring-[#c6dfdc]'
                : 'bg-white/75 text-slate-500 hover:bg-white'
            }`}
            title={searchMode === 'rag' ? '语义向量检索' : '关键词索引检索'}
          >
            <Search size={13} />
            <span className="whitespace-nowrap">{searchMode === 'rag' ? 'RAG 增强' : '索引检索'}</span>
          </button>
        </div>
      )}

      <div className="relative flex w-full items-end gap-2 rounded-[1.35rem] border border-white/75 bg-white/85 p-2.5 shadow-[0_12px_36px_rgba(86,126,134,0.1)] sm:rounded-[1.5rem] sm:p-3">
        <textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="把想说的话慢慢写下来..."
          className="min-h-[36px] max-h-[160px] flex-1 resize-none border-none bg-transparent px-2 py-1 text-[13px] text-slate-700 outline-none sm:max-h-[180px] sm:text-sm"
          rows={1}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          className={`shrink-0 rounded-[1.1rem] p-2.5 transition sm:rounded-2xl ${
            input.trim() && !isLoading
              ? 'bg-[linear-gradient(135deg,#6a9ba0,#517d84)] text-white hover:opacity-95'
              : 'bg-slate-100 text-slate-300'
          }`}
        >
          <Send size={16} />
        </button>
      </div>

      <p className="mt-2 px-2 text-center text-[11px] leading-5 text-slate-400 sm:text-xs">
        本系统用于心理支持与自助筛查，不作为正式医疗诊断依据。
      </p>
    </div>
  );
}
