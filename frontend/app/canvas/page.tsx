'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import DrawingCanvas from '@/components/DrawingCanvas';
import CanvasAnalysisPanel from '@/features/canvas/components/CanvasAnalysisPanel';
import { useCanvasAnalysis } from '@/features/canvas/hooks/useCanvasAnalysis';
import { canvasCopy, commonCopy } from '@/shared/copy/app-copy';

export default function CanvasPage() {
  const { analysis, error, isLoading, reflectionText, setReflectionText, handleExport } = useCanvasAnalysis();

  return (
    <div className="mist-page min-h-screen">
      <div className="mist-container min-h-screen">
        <AppHeader />
        <main className="p-3 sm:p-4 md:p-6">
          <div className="mx-auto max-w-5xl">
            <Link href="/chat" className="mist-link mb-4 inline-flex items-center text-sm sm:mb-6">
              <ArrowLeft size={18} className="mr-1" />
              {commonCopy.actions.backToChat}
            </Link>

            <div className="mb-6 text-center sm:mb-8">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{canvasCopy.title}</h1>
              <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">{canvasCopy.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DrawingCanvas onExport={handleExport} isLoading={isLoading} />
                <div className="mist-panel mt-4 rounded-[1.35rem] p-4 sm:rounded-[1.5rem]">
                  <label className="mb-2 block text-sm font-medium text-slate-700">{canvasCopy.reflectionLabel}</label>
                  <textarea
                    value={reflectionText}
                    onChange={(event) => setReflectionText(event.target.value)}
                    placeholder={canvasCopy.reflectionPlaceholder}
                    className="min-h-[110px] w-full rounded-[1.2rem] border border-slate-200 bg-white/90 p-3 text-sm outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea]"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <CanvasAnalysisPanel isLoading={isLoading} analysis={analysis} error={error} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
