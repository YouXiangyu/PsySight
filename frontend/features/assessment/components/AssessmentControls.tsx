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
      <div className="mb-6 h-1.5 w-full rounded-full bg-white/70 sm:mb-8">
        <div className="h-full rounded-full bg-[linear-gradient(135deg,#6a9ba0,#517d84)] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="mb-5 flex flex-col gap-3 text-xs text-slate-500 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <span>预计剩余 {remainingMin} 分钟</span>
        <button
          onClick={onTogglePause}
          className="mist-secondary-button inline-flex w-full items-center justify-center gap-1 rounded-full px-3 py-2 sm:w-auto sm:py-1.5"
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
          {isPaused ? '继续作答' : '暂停作答'}
        </button>
      </div>

      <div className={`mt-8 flex flex-col gap-3 sm:flex-row ${currentIdx === 0 ? 'sm:justify-end' : 'sm:justify-between'}`}>
        {currentIdx > 0 && (
          <button
            disabled={isPaused}
            onClick={onPrev}
            className="inline-flex items-center justify-center rounded-full bg-white/78 px-4 py-2.5 text-slate-500 shadow-[0_10px_28px_rgba(86,126,134,0.08)] transition hover:bg-white disabled:opacity-50 sm:bg-transparent sm:px-3 sm:py-2 sm:shadow-none"
          >
            <ChevronLeft className="mr-2" size={20} />
            上一题
          </button>
        )}

        {currentIdx === total - 1 ? (
          <button
            onClick={onSubmit}
            disabled={isSubmitting || isPaused || !canSubmit}
            className="mist-primary-button inline-flex w-full items-center justify-center rounded-[1.25rem] px-6 py-3 text-sm font-bold disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" size={20} />}
            生成 AI 报告
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canGoNext || isPaused}
            className="inline-flex w-full items-center justify-center rounded-full bg-white/78 px-4 py-2.5 font-medium text-[#517d84] shadow-[0_10px_28px_rgba(86,126,134,0.08)] transition hover:bg-white disabled:opacity-30 sm:w-auto sm:bg-transparent sm:px-3 sm:py-2 sm:shadow-none"
          >
            下一题
            <ChevronRight className="ml-2" size={20} />
          </button>
        )}
      </div>
    </>
  );
}
