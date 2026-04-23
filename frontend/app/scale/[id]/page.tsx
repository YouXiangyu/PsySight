'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';

import AssessmentControls from '@/features/assessment/components/AssessmentControls';
import AssessmentHeader from '@/features/assessment/components/AssessmentHeader';
import EncouragementScreen from '@/features/assessment/components/EncouragementScreen';
import QuestionCard from '@/features/assessment/components/QuestionCard';
import { useScaleAssessment } from '@/features/assessment/hooks/useScaleAssessment';

export default function ScalePage() {
  const router = useRouter();
  const { id } = useParams();
  const rawId = Array.isArray(id) ? id[0] : id;
  const isNumericId = typeof rawId === 'string' && /^\d+$/.test(rawId);
  const scaleId = isNumericId ? Number(rawId) : null;

  useEffect(() => {
    if (rawId && !isNumericId) {
      router.replace(`/scale-code/${encodeURIComponent(rawId)}`);
    }
  }, [isNumericId, rawId, router]);

  if (rawId && !isNumericId) {
    return (
      <div className="mist-page px-3 py-6 sm:px-4 sm:py-8 md:py-12">
        <div className="mist-container mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/75 bg-white/85 p-6 shadow-[0_20px_60px_rgba(86,126,134,0.12)] backdrop-blur">
          <div className="flex items-center gap-3 text-[#517d84]">
            <Loader2 className="animate-spin" size={20} />
            <p className="text-sm font-medium">正在解析量表链接...</p>
          </div>
        </div>
      </div>
    );
  }

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
    handleReturnHome,
  } = useScaleAssessment(scaleId);

  if (isBootstrapping || !scale) {
    return (
      <div className="mist-page px-3 py-6 sm:px-4 sm:py-8 md:py-12">
        <div className="mist-container mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/75 bg-white/85 p-6 shadow-[0_20px_60px_rgba(86,126,134,0.12)] backdrop-blur">
          <div className="flex items-center gap-3 text-[#517d84]">
            <Loader2 className="animate-spin" size={20} />
            <p className="text-sm font-medium">{loadingHint}</p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-100" />
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-100" />
            <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <p className="mt-4 text-xs text-slate-500">如果网络较慢，请稍等 1 到 2 秒，题目正在准备中。</p>
        </div>
      </div>
    );
  }

  if (showEncouragement) {
    return <EncouragementScreen />;
  }

  if (!currentQ) {
    return (
      <div className="mist-page px-3 py-6 sm:px-4 sm:py-8 md:py-12">
        <div className="mist-container mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/75 bg-white/85 p-6 shadow-[0_20px_60px_rgba(86,126,134,0.12)] backdrop-blur">
          <div className="flex items-center gap-3 text-[#517d84]">
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
    <main className="mist-page flex min-h-screen flex-col items-center p-3 sm:p-4 md:p-8">
      <div className="mist-container w-full max-w-2xl">
        <AssessmentHeader
          scale={scale}
          emotionEnabled={emotionEnabled && consentConfirmed}
          onToggleEmotion={toggleEmotion}
          onEmotionUpdate={handleEmotionUpdate}
          onReturnHome={handleReturnHome}
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
          <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-4 flex items-start gap-2 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <ShieldCheck size={14} className="mt-0.5" />
            游客模式下也可以完成测评，但如果你希望长期保存报告与历史记录，建议先登录账户。
          </div>
        )}
      </div>
    </main>
  );
}
