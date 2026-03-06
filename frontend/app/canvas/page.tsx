'use client';

import React from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CanvasAnalysisPanel from '@/features/canvas/components/CanvasAnalysisPanel';
import { useCanvasAnalysis } from '@/features/canvas/hooks/useCanvasAnalysis';

export default function CanvasPage() {
  const { analysis, isLoading, reflectionText, setReflectionText, handleExport } = useCanvasAnalysis();

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

          <div className="lg:col-span-1">
            <CanvasAnalysisPanel isLoading={isLoading} analysis={analysis} />
          </div>
        </div>
      </div>
    </main>
  );
}
