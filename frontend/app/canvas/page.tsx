'use client';

import React, { useState } from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import { analyzeCanvas } from '@/lib/api';
import { Sparkles, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function CanvasPage() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  const handleExport = async (payload: {
    imageData: string;
    drawingMeta: { colors_used: string[]; stroke_count: number; has_htp_elements: boolean };
  }) => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeCanvas({
        image_data: payload.imageData,
        drawing_meta: payload.drawingMeta,
        reflection_text: reflectionText,
      });
      setAnalysis(result.analysis);
    } catch (error) {
      alert("分析失败，请检查后端连接或 API 额度。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft size={18} className="mr-1" /> 返回首页
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">心理绘画实验室</h1>
          <p className="text-slate-500 mt-2">通过投射分析探索你的潜意识</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧画板 */}
          <div className="lg:col-span-2">
            <DrawingCanvas onExport={handleExport} isLoading={isLoading} />
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                可选：补充你想表达的感受（帮助 AI 给出更有针对性的解读）
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="例如：最近有点孤独，画里的树是我理想中的自己..."
                className="w-full min-h-[90px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* 右侧分析结果 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[400px] p-6 flex flex-col">
              <div className="flex items-center space-x-2 mb-4 text-indigo-600">
                <Sparkles size={20} />
                <h2 className="font-bold">AI 分析报告</h2>
              </div>

              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-sm text-slate-400">DeepSeek 正在解读画作...</p>
                </div>
              ) : analysis ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap prose prose-slate">
                    {analysis}
                  </div>
                  <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-400">
                    * 本分析基于心理学投射原理，仅供参考，不作为医学诊断。
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Pencil size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400">在画板上画出“房、树、人”后点击提交，AI 报告将在此处显示。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
