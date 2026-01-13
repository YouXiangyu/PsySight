'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScaleDetail, submitAssessment } from '@/lib/api';
import FaceMonitor from '@/components/FaceMonitor';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ScalePage() {
  const { id } = useParams();
  const router = useRouter();
  const [scale, setScale] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [emotions, setEmotions] = useState<Record<string, number[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getScaleDetail(Number(id)).then(setScale);
  }, [id]);

  const handleEmotionUpdate = (data: Record<string, number>) => {
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
    const qId = scale.questions[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: score }));
    if (currentIdx < scale.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // 计算平均情绪
    const avgEmotions: Record<string, number> = {};
    Object.entries(emotions).forEach(([emotion, values]) => {
      avgEmotions[emotion] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    try {
      const result = await submitAssessment({
        user_id: 1, // 模拟用户 ID
        scale_id: Number(id),
        answers,
        emotion_log: avgEmotions
      });
      router.push(`/report/${result.record_id}`);
    } catch (error) {
      alert("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!scale) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

  const currentQ = scale.questions[currentIdx];
  const progress = ((currentIdx + 1) / scale.questions.length) * 100;

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{scale.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{scale.description}</p>
          </div>
          <FaceMonitor onEmotionUpdate={handleEmotionUpdate} />
        </div>

        {/* 进度条 */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
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
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQ.id] === opt.score 
                    ? 'border-indigo-600 bg-indigo-50' 
                    : 'border-slate-100 hover:border-slate-300'
                }`}
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
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" size={20} />}
              生成 AI 报告
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              disabled={answers[currentQ.id] === undefined}
              className="flex items-center px-6 py-2 text-indigo-600 font-medium disabled:opacity-30"
            >
              下一题 <ChevronRight className="ml-2" size={20} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
