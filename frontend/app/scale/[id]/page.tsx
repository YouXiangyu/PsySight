'use client';

import { useParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';

import AssessmentControls from '@/features/assessment/components/AssessmentControls';
import AssessmentHeader from '@/features/assessment/components/AssessmentHeader';
import EncouragementScreen from '@/features/assessment/components/EncouragementScreen';
import QuestionCard from '@/features/assessment/components/QuestionCard';
import { useScaleAssessment } from '@/features/assessment/hooks/useScaleAssessment';

export default function ScalePage() {
  const { id } = useParams();
  const scaleId = id ? Number(id) : null;
  const {
    scale,
    currentIdx,
    currentQ,
    answers,
    emotionEnabled,
    consentConfirmed,
    isPaused,
    isAuthenticated,
    isSubmitting,
    isBootstrapping,
    isChunkLoading,
    loadingHint,
    questionTotal,
    showEncouragement,
    errorMsg,
    progress,
    remainingMin,
    setCurrentIdx,
    setIsPaused,
    handleEmotionUpdate,
    handleAnswer,
    toggleEmotion,
    handleSubmit,
  } = useScaleAssessment(scaleId);

  if (isBootstrapping || !scale) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-700">
            <Loader2 className="animate-spin" size={20} />
            <p className="text-sm font-medium">{loadingHint}</p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <p className="mt-4 text-xs text-slate-500">若网络较慢，请稍候 1-2 秒，题目正在准备中。</p>
        </div>
      </div>
    );
  }

  if (showEncouragement) {
    return <EncouragementScreen />;
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-700">
            <Loader2 className="animate-spin" size={20} />
            <p className="text-sm font-medium">{isChunkLoading ? '正在加载后续题目...' : loadingHint}</p>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = questionTotal > 0 && Object.keys(answers).length === questionTotal;
  const canGoNext = answers[currentQ.id] !== undefined;

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <AssessmentHeader
          scale={scale}
          emotionEnabled={emotionEnabled && consentConfirmed}
          onToggleEmotion={toggleEmotion}
          onEmotionUpdate={handleEmotionUpdate}
        />

        <AssessmentControls
          currentIdx={currentIdx}
          total={questionTotal}
          progress={progress}
          remainingMin={remainingMin}
          isPaused={isPaused}
          isSubmitting={isSubmitting}
          canGoNext={canGoNext}
          canSubmit={canSubmit}
          onTogglePause={() => setIsPaused((prev) => !prev)}
          onPrev={() => setCurrentIdx(currentIdx - 1)}
          onNext={() => setCurrentIdx(currentIdx + 1)}
          onSubmit={handleSubmit}
        />

        <QuestionCard
          currentIdx={currentIdx}
          total={questionTotal}
          currentQ={currentQ}
          answers={answers}
          isPaused={isPaused}
          onAnswer={handleAnswer}
        />

        {!!errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{errorMsg}</div>
        )}
        {!isAuthenticated && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldCheck size={14} className="mt-0.5" />
            匿名模式下可完成测评，但若希望长期保存历史报告，建议先登录账号。
          </div>
        )}
      </div>
    </main>
  );
}
