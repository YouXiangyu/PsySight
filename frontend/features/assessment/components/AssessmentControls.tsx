import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';

interface AssessmentControlsProps {
  currentIdx: number;
  total: number;
  progress: number;
  remainingMin: number;
  isPaused: boolean;
  isSubmitting: boolean;
  canGoNext: boolean;
  canSubmit: boolean;
  onTogglePause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function AssessmentControls({
  currentIdx,
  total,
  progress,
  remainingMin,
  isPaused,
  isSubmitting,
  canGoNext,
  canSubmit,
  onTogglePause,
  onPrev,
  onNext,
  onSubmit,
}: AssessmentControlsProps) {
  return (
    <>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8">
        <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500">
        <span>预计剩余 {remainingMin} 分钟</span>
        <button
          onClick={onTogglePause}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
          {isPaused ? '继续作答' : '暂停作答'}
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button
          disabled={currentIdx === 0}
          onClick={onPrev}
          className="flex items-center px-6 py-2 text-slate-500 disabled:opacity-0"
        >
          <ChevronLeft className="mr-2" size={20} /> 上一题
        </button>

        {currentIdx === total - 1 ? (
          <button
            onClick={onSubmit}
            disabled={isSubmitting || isPaused || !canSubmit}
            className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" size={20} />}
            生成 AI 报告
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canGoNext || isPaused}
            className="flex items-center px-6 py-2 text-indigo-600 font-medium disabled:opacity-30"
          >
            下一题 <ChevronRight className="ml-2" size={20} />
          </button>
        )}
      </div>
    </>
  );
}
