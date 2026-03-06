'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface OnboardingGuideProps {
  open: boolean;
  onFinish: () => void;
}

const STEPS = [
  {
    title: '欢迎来到 PsySight',
    content: '这里是一个可以倾诉、测评和查看心理报告的空间。你可以从聊天开始，也可以直接去量表库。',
  },
  {
    title: '从对话到测评',
    content: '首页支持 AI 共情对话。识别到焦虑/失眠/低落倾向时，会推荐对应量表并一键开始测评。',
  },
  {
    title: '结果与群体视角',
    content: '完成测评后可查看专属报告。顶部匿名统计支持概览、人群画像与词云切换，帮助你感受“并不孤单”。',
  },
  {
    title: '紧急情况下',
    content: '页面右下角始终有“紧急求助”入口。如果你正处于危机，请优先联系专业机构与热线。',
  },
];

export default function OnboardingGuide({ open, onFinish }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const progress = useMemo(() => `${step + 1} / ${STEPS.length}`, [step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm text-slate-500">新手引导 {progress}</p>
          <button
            type="button"
            onClick={onFinish}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭引导"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-6">
          <h2 className="text-lg font-semibold text-slate-800">{current.title}</h2>
          <p className="mt-3 text-sm text-slate-600 leading-7">{current.content}</p>
        </div>

        <div className="px-5 pb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            上一步
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFinish}
              className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              跳过
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                下一步
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                开始使用
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
