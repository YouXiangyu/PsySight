'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMe, getScaleDetail, submitAssessment } from '@/lib/api';
import FaceMonitor from '@/components/FaceMonitor';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Pause, Play, ShieldCheck } from 'lucide-react';

const getProgressKey = (scaleId: number) => `psysight_scale_progress_${scaleId}`;

export default function ScalePage() {
  const { id } = useParams();
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
    if (!id) return;
    getScaleDetail(Number(id)).then((res) => {
      setScale(res);
      const saved = localStorage.getItem(getProgressKey(Number(id)));
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
  }, [id]);

  useEffect(() => {
    if (!id || !scale) return;
    localStorage.setItem(
      getProgressKey(Number(id)),
      JSON.stringify({ currentIdx, answers, startedAt })
    );
  }, [answers, currentIdx, id, scale, startedAt]);

  const handleEmotionUpdate = (data: Record<string, number>) => {
    if (!emotionEnabled) return;
    setEmotions(prev => {
      const next = { ...prev };
      Object.entries(data).forEach(([emotion, value]) => {
        if (!next[emotion]) next[emotion] = [];
        next[emotion].push(value);
      });
      return next;
    });
  };

  const handleAnswer = (score: number) => {
    if (isPaused) return;
    const qId = scale.questions[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: score }));
    if (currentIdx < scale.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    // 计算平均情绪
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
        scale_id: Number(id),
        answers,
        emotion_log: avgEmotions,
        emotion_consent: emotionEnabled && consentConfirmed,
        anonymous,
      });
      localStorage.removeItem(getProgressKey(Number(id)));
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

  if (!scale) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (showEncouragement) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-indigo-600 mb-2">你完成了很重要的一步</p>
          <h2 className="text-xl font-semibold text-slate-800">谢谢你认真对待自己的感受</h2>
          <p className="mt-3 text-sm text-slate-500">报告正在整理中，我们马上带你查看结果。</p>
          <div className="mt-6 h-2 rounded-full bg-indigo-100 overflow-hidden">
            <div className="h-full w-1/2 bg-indigo-500 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  const currentQ = scale.questions[currentIdx];
  const progress = ((currentIdx + 1) / scale.questions.length) * 100;
  const elapsedMin = Math.max(1, Math.floor((Date.now() - startedAt) / 1000 / 60));
  const estimatedTotalMin = scale.estimated_minutes || Math.max(5, Math.ceil(scale.questions.length / 2));
  const remainingMin = Math.max(0, estimatedTotalMin - Math.floor((elapsedMin * (currentIdx + 1)) / Math.max(1, currentIdx + 1)));

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{scale.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{scale.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <FaceMonitor enabled={emotionEnabled && consentConfirmed} onEmotionUpdate={handleEmotionUpdate} />
            <button
              onClick={() => {
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
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                emotionEnabled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {emotionEnabled ? '关闭情绪感知' : '开启情绪感知'}
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-6 flex items-center justify-between text-xs text-slate-500">
          <span>预计剩余 {remainingMin} 分钟</span>
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            {isPaused ? '继续作答' : '暂停作答'}
          </button>
        </div>

        {/* 题目卡片 */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
          <span className="text-indigo-600 font-bold text-sm mb-4">问题 {currentIdx + 1} / {scale.questions.length}</span>
          <h2 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="space-y-3 mt-auto">
            {currentQ.options.map((opt: any, idx: number) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt.score)}
                disabled={isPaused}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQ.id] === opt.score 
                    ? 'border-indigo-600 bg-indigo-50' 
                    : 'border-slate-100 hover:border-slate-300'
                } ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-between mt-8">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="flex items-center px-6 py-2 text-slate-500 disabled:opacity-0"
          >
            <ChevronLeft className="mr-2" size={20} /> 上一题
          </button>
          
          {currentIdx === scale.questions.length - 1 && Object.keys(answers).length === scale.questions.length ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isPaused}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" size={20} />}
              生成 AI 报告
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              disabled={answers[currentQ.id] === undefined || isPaused}
              className="flex items-center px-6 py-2 text-indigo-600 font-medium disabled:opacity-30"
            >
              下一题 <ChevronRight className="ml-2" size={20} />
            </button>
          )}
        </div>
        {!!errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errorMsg}
          </div>
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
