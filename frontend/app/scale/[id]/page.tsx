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

  if (!scale) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (showEncouragement) {
    return <EncouragementScreen />;
  }

  if (!currentQ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const canSubmit = Object.keys(answers).length === scale.questions.length;
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
          total={scale.questions.length}
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
          total={scale.questions.length}
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
