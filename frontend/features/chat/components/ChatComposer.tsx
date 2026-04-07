import { Brain, Search, Send, Zap } from 'lucide-react';

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
  onToggleAgent,
}: ChatComposerProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {useAgent && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <button
            onClick={onToggleThinking}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              useThinking
                ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={useThinking ? '深度思考模式 (deepseek-v3.2-exp-think)' : '快速模式 (deepseek-v3.2)'}
          >
            <Brain size={13} />
            {useThinking ? '深度思考' : '快速回复'}
          </button>
          <button
            onClick={onToggleSearchMode}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              searchMode === 'rag'
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={searchMode === 'rag' ? '语义向量检索 (RAG)' : '关键词索引检索'}
          >
            <Search size={13} />
            {searchMode === 'rag' ? 'RAG 检索' : '索引检索'}
          </button>
        </div>
      )}
      <div className="relative flex items-end w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          onClick={onToggleAgent}
          className={`mr-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            useAgent
              ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
          }`}
          title={useAgent ? 'Agent 模式 (LangGraph)' : '经典模式 (直连 Flask)'}
        >
          <Zap size={13} />
          {useAgent ? 'Agent' : '经典'}
        </button>
        <textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="把想说的话慢慢打下来..."
          className="min-h-[28px] max-h-[180px] flex-1 resize-none border-none bg-transparent px-2 py-1 text-sm text-slate-700 outline-none"
          rows={1}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          className={`rounded-md p-2 ${
            input.trim() && !isLoading ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-300'
          }`}
        >
          <Send size={16} />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">本系统用于心理支持与自助筛查，不作为医疗诊断依据。</p>
    </div>
  );
}
