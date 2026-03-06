import { Pencil, Sparkles } from 'lucide-react';

interface CanvasAnalysisPanelProps {
  isLoading: boolean;
  analysis: string | null;
}

export default function CanvasAnalysisPanel({ isLoading, analysis }: CanvasAnalysisPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[400px] p-6 flex flex-col">
      <div className="flex items-center space-x-2 mb-4 text-indigo-600">
        <Sparkles size={20} />
        <h2 className="font-bold">AI 分析报告</h2>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">DeepSeek 正在解读画作...</p>
        </div>
      ) : analysis ? (
        <div className="flex-1 overflow-y-auto">
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap prose prose-slate">{analysis}</div>
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-400">
            * 本分析基于心理学投射原理，仅供参考，不作为医学诊断。
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Pencil size={24} className="text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">在画板上画出“房、树、人”后点击提交，AI 报告将在此处显示。</p>
        </div>
      )}
    </div>
  );
}
