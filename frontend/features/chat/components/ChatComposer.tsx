import { Send } from 'lucide-react';

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatComposer({ input, isLoading, onChange, onSend }: ChatComposerProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative flex items-end w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
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
