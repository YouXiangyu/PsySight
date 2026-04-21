import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getMe, getScaleMeta, getScaleQuestionsChunk, submitAssessment } from '@/lib/api';

const getProgressKey = (scaleId: number) => `psysight_scale_progress_${scaleId}`;
const createDelay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const QUESTION_CHUNK_SIZE = 10;
const PREFETCH_THRESHOLD = 5;

export function useScaleAssessment(scaleId: number | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [loadingHint, setLoadingHint] = useState('正在准备题目...');
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [isChunkLoading, setIsChunkLoading] = useState(false);

  const chatSession = searchParams.get('session');
  const homeHref = chatSession ? `/?session=${encodeURIComponent(chatSession)}` : '/';

  useEffect(() => {
    if (!scaleId) return;

    let cancelled = false;
    const minLoadingMs = 800 + Math.floor(Math.random() * 1201);
    setIsBootstrapping(true);
    setLoadingHint('正在连接服务...');
    setErrorMsg('');
    setScale(null);
    setCurrentIdx(0);
    setAnswers({});
    setQuestions([]);
    setQuestionTotal(0);
    setNextOffset(0);
    setHasMoreQuestions(true);
    setIsChunkLoading(false);

    const phaseTimer = window.setTimeout(() => {
      if (!cancelled) {
        setLoadingHint('正在加载量表题目...');
      }
    }, 450);
    const phaseTimer2 = window.setTimeout(() => {
      if (!cancelled) {
        setLoadingHint('正在恢复你的作答进度...');
      }
    }, 1150);

    const load = async () => {
      const [scaleResult, meResult] = await Promise.allSettled([getScaleMeta(scaleId), getMe(), createDelay(minLoadingMs)]);

      if (cancelled) return;

      if (scaleResult.status === 'fulfilled') {
        setScale(scaleResult.value);
        const total = scaleResult.value?.question_count || 0;
        setQuestionTotal(total);

        let restoredIdx = 0;
        let restoredAnswers: Record<string, number> = {};
        let restoredStartedAt = Date.now();

        const saved = localStorage.getItem(getProgressKey(scaleId));
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            restoredIdx = Math.max(0, Math.min(parsed.currentIdx || 0, Math.max(0, total - 1)));
            restoredAnswers = parsed.answers || {};
            restoredStartedAt = parsed.startedAt || Date.now();
          } catch {
            restoredStartedAt = Date.now();
          }
        }
        setCurrentIdx(restoredIdx);
        setAnswers(restoredAnswers);
        setStartedAt(restoredStartedAt);

        setIsChunkLoading(true);
        setLoadingHint('正在加载首批题目...');
        try {
          let chunk = await getScaleQuestionsChunk(scaleId, 0, QUESTION_CHUNK_SIZE);
          if (cancelled) return;

          let mergedQuestions: any[] = [];
          chunk.items.forEach((item, index) => {
            mergedQuestions[chunk.offset + index] = item;
          });
          let cursor = chunk.offset + chunk.items.length;
          let hasMore = chunk.has_more;

          while (hasMore && cursor <= restoredIdx) {
            setLoadingHint('正在继续加载你上次做到的位置...');
            chunk = await getScaleQuestionsChunk(scaleId, cursor, QUESTION_CHUNK_SIZE);
            if (cancelled) return;
            chunk.items.forEach((item, index) => {
              mergedQuestions[chunk.offset + index] = item;
            });
            cursor = chunk.offset + chunk.items.length;
            hasMore = chunk.has_more;
          }

          setQuestions(mergedQuestions);
          setNextOffset(cursor);
          setHasMoreQuestions(hasMore);
        } catch {
          setErrorMsg('题目加载失败，请返回重试');
        } finally {
          setIsChunkLoading(false);
        }
      } else {
        setErrorMsg('题目加载失败，请返回重试');
      }

      if (meResult.status === 'fulfilled') {
        setIsAuthenticated(meResult.value.authenticated);
      } else {
        setIsAuthenticated(false);
      }

      setIsBootstrapping(false);
    };

    load().catch(() => {
      if (cancelled) return;
      setErrorMsg('题目加载失败，请返回重试');
      setIsBootstrapping(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(phaseTimer);
      window.clearTimeout(phaseTimer2);
    };
  }, [scaleId]);

  useEffect(() => {
    if (!scaleId || !scale) return;
    localStorage.setItem(getProgressKey(scaleId), JSON.stringify({ currentIdx, answers, startedAt }));
  }, [answers, currentIdx, scaleId, scale, startedAt]);

  const loadNextQuestions = async () => {
    if (!scaleId || !hasMoreQuestions || isChunkLoading) return;
    setIsChunkLoading(true);
    try {
      const chunk = await getScaleQuestionsChunk(scaleId, nextOffset, QUESTION_CHUNK_SIZE);
      setQuestions((prev) => {
        const merged = [...prev];
        chunk.items.forEach((item, index) => {
          merged[chunk.offset + index] = item;
        });
        return merged;
      });
      setQuestionTotal(chunk.total);
      setNextOffset(chunk.offset + chunk.items.length);
      setHasMoreQuestions(chunk.has_more);
    } catch {
      setErrorMsg('加载后续题目失败，请稍后重试');
    } finally {
      setIsChunkLoading(false);
    }
  };

  useEffect(() => {
    if (isBootstrapping || !scale || !hasMoreQuestions || isChunkLoading) return;
    const remainingLoaded = nextOffset - (currentIdx + 1);
    if (remainingLoaded < PREFETCH_THRESHOLD) {
      loadNextQuestions();
    }
  }, [currentIdx, hasMoreQuestions, isBootstrapping, isChunkLoading, nextOffset, scale]);

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
    const currentQuestion = questions[currentIdx];
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [qId]: score }));
    if (currentIdx < questionTotal - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const toggleEmotion = () => {
    if (!consentConfirmed) {
      const accepted = window.confirm(
        '隐私说明：仅在你同意并开启后采集聚合情绪数据，不保存原始视频帧。关闭后会立即停止采集。'
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

  const handleReturnHome = () => {
    const hasAnswered = Object.keys(answers).length > 0;
    if (hasAnswered) {
      const confirmed = window.confirm('当前作答进度已保存，可以稍后继续。现在返回首页吗？');
      if (!confirmed) return;
    }
    router.push(homeHref);
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
        '登录后可以保存报告与历史记录。点击“确定”继续匿名测评，点击“取消”前往登录。'
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
        const reportHref = chatSession
          ? `/report/${result.record_id}?session=${encodeURIComponent(chatSession)}`
          : `/report/${result.record_id}`;
        router.push(reportHref);
      }, 2300);
    } catch (error) {
      setErrorMsg((error as Error).message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = useMemo(() => (scale ? questions[currentIdx] || null : null), [currentIdx, questions, scale]);
  const progress = useMemo(
    () => (scale && questionTotal > 0 ? ((currentIdx + 1) / questionTotal) * 100 : 0),
    [currentIdx, questionTotal, scale]
  );
  const elapsedMin = Math.max(1, Math.floor((Date.now() - startedAt) / 1000 / 60));
  const estimatedTotalMin = scale?.estimated_minutes || (questionTotal > 0 ? Math.max(5, Math.ceil(questionTotal / 2)) : 5);
  const remainingMin = Math.max(0, estimatedTotalMin - elapsedMin);

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
  };
}
