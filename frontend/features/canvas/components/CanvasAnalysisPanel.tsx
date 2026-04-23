import { Pencil, Sparkles } from 'lucide-react';
import StatePanel from '@/components/StatePanel';
import { canvasCopy } from '@/shared/copy/app-copy';

interface CanvasAnalysisPanelProps {
  isLoading: boolean;
  analysis: string | null;
  error: string;
}

export default function CanvasAnalysisPanel({ isLoading, analysis, error }: CanvasAnalysisPanelProps) {
  return (
    <div className="mist-panel flex h-full min-h-[320px] flex-col rounded-[1.5rem] p-4 sm:min-h-[360px] sm:rounded-[1.65rem] sm:p-5 md:min-h-[400px] md:rounded-[1.75rem] md:p-6">
      <div className="mb-4 flex items-center space-x-2 text-[#517d84]">
        <Sparkles size={20} />
        <h2 className="font-bold">{canvasCopy.analysisTitle}</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9ebe7] border-t-[#517d84]" />
          <p className="text-sm text-slate-400">{canvasCopy.analysisLoading}</p>
        </div>
      ) : error ? (
        <div className="my-auto">
          <StatePanel title={canvasCopy.analysisErrorTitle} description={error} tone="danger" />
        </div>
      ) : analysis ? (
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-slate whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{analysis}</div>
          <div className="mt-6 rounded-[1.25rem] border border-slate-100 bg-[#f7fbfb] p-3 text-[10px] text-slate-400">
            * {canvasCopy.analysisDisclaimer}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f9f8]">
            <Pencil size={24} className="text-slate-300" />
          </div>
          <p className="text-sm leading-7 text-slate-400">{canvasCopy.analysisEmptyDescription}</p>
        </div>
      )}
    </div>
  );
}
