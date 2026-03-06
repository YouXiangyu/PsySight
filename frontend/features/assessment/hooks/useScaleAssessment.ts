import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getMe, getScaleDetail, submitAssessment } from '@/lib/api';

const getProgressKey = (scaleId: number) => `psysight_scale_progress_${scaleId}`;

export function useScaleAssessment(scaleId: number | null) {
  const router = useRouter();
  const [scale, setScale] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [emotions, setEmotions] = useState<Record<string, number[]>>({});
  const [emotionEnabled, setEmotionEnabled] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!scaleId) return;
    getScaleDetail(scaleId).then((res) => {
      setScale(res);
      const saved = localStorage.getItem(getProgressKey(scaleId));
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentIdx(parsed.currentIdx || 0);
          setAnswers(parsed.answers || {});
          setStartedAt(parsed.startedAt || Date.now());
        } catch {
          // 忽略损坏缓存
        }
      } else {
        setStartedAt(Date.now());
      }
    });
    getMe()
      .then((res) => setIsAuthenticated(res.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, [scaleId]);

  useEffect(() => {
    if (!scaleId || !scale) return;
    localStorage.setItem(getProgressKey(scaleId), JSON.stringify({ currentIdx, answers, startedAt }));
  }, [answers, currentIdx, scaleId, scale, startedAt]);

  const handleEmotionUpdate = (data: Record<string, number>) => {
    if (!emotionEnabled) return;
    setEmotions((prev) => {
      const next = { ...prev };
      Object.entries(data).forEach(([emotion, value]) => {
        if (!next[emotion]) next[emotion] = [];
        next[emotion].push(value);
      });
      return next;
    });
  };

  const handleAnswer = (score: number) => {
    if (!scale || isPaused) return;
    const qId = scale.questions[currentIdx].id;
    setAnswers((prev) => ({ ...prev, [qId]: score }));
    if (currentIdx < scale.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const toggleEmotion = () => {
    if (!consentConfirmed) {
      const accepted = window.confirm(
        '隐私说明：仅在你同意并开启后采集聚合情绪数据（不保存原始视频帧）。关闭后立即停止采集。'
      );
      if (!accepted) return;
      setConsentConfirmed(true);
    }
    setEmotionEnabled((prev) => {
      if (prev) {
        setEmotions({});
      }
      return !prev;
    });
  };

  const handleSubmit = async () => {
    if (!scaleId) return;
    setIsSubmitting(true);
    setErrorMsg('');

    const avgEmotions: Record<string, number> = {};
    if (emotionEnabled && consentConfirmed) {
      Object.entries(emotions).forEach(([emotion, values]) => {
        avgEmotions[emotion] = values.reduce((a, b) => a + b, 0) / values.length;
      });
    }

    let anonymous = true;
    if (isAuthenticated) {
      anonymous = false;
    } else {
      const continueAsAnonymous = window.confirm(
        '登录后可保存报告与历史记录。点击“确定”继续匿名测评，点击“取消”前往登录。'
      );
      if (!continueAsAnonymous) {
        router.push('/auth');
        setIsSubmitting(false);
        return;
      }
      anonymous = true;
    }

    try {
      const result = await submitAssessment({
        scale_id: scaleId,
        answers,
        emotion_log: avgEmotions,
        emotion_consent: emotionEnabled && consentConfirmed,
        anonymous,
      });
      localStorage.removeItem(getProgressKey(scaleId));
      setShowEncouragement(true);
      window.setTimeout(() => {
        router.push(`/report/${result.record_id}`);
      }, 2300);
    } catch (error) {
      setErrorMsg((error as Error).message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = useMemo(() => (scale ? scale.questions[currentIdx] : null), [currentIdx, scale]);
  const progress = useMemo(() => (scale ? ((currentIdx + 1) / scale.questions.length) * 100 : 0), [currentIdx, scale]);
  const elapsedMin = Math.max(1, Math.floor((Date.now() - startedAt) / 1000 / 60));
  const estimatedTotalMin = scale?.estimated_minutes || (scale ? Math.max(5, Math.ceil(scale.questions.length / 2)) : 5);
  const remainingMin = Math.max(0, estimatedTotalMin - Math.floor((elapsedMin * (currentIdx + 1)) / Math.max(1, currentIdx + 1)));

  return {
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
  };
}
