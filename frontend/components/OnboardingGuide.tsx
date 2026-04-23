'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface OnboardingGuideProps {
  open: boolean;
  onFinish: () => void;
}

const STEPS = [
  {
    title: '欢迎来到 PsySight',
    content: '这里是一个可以倾诉、测评并查看心理报告的空间。你可以先从聊天开始，也可以直接进入量表库。',
  },
  {
    title: '从对话到测评',
    content: '聊天室支持 AI 共情陪伴。当系统识别到焦虑、失眠或低落等线索时，会推荐合适量表供你继续探索。',
  },
  {
    title: '结果与群体视角',
    content: '完成测评后可以查看专属报告。顶部导航中的匿名统计页面还能帮助你看到更宏观的人群趋势。',
  },
  {
    title: '面对紧急情况',
    content: '如果对话中识别到明显危机信号，系统会持续提醒你优先联系专业机构与热线资源。',
  },
];

export default function OnboardingGuide({ open, onFinish }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    if (open) {
      setStep(0);
    }
  }, [open]);

  const progress = useMemo(() => `${step + 1} / ${STEPS.length}`, [step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(170,215,209,0.24),transparent_42%),rgba(15,23,42,0.26)] p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,251,250,0.94))] shadow-[0_30px_90px_rgba(30,60,70,0.22)] backdrop-blur-xl sm:rounded-[2.2rem]">
        <div className="pointer-events-none absolute -right-12 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(179,220,214,0.38),transparent_72%)]" />
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-full bg-[linear-gradient(180deg,rgba(233,247,244,0.88),rgba(255,255,255,0))]" />

        <div className="relative px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#63898d]">新手引导</p>
              <p className="mt-1 text-sm text-slate-500">{progress}</p>
            </div>
            <button
              type="button"
              onClick={onFinish}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/85 hover:text-slate-600"
              aria-label="关闭引导"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === step ? 'w-8 bg-[linear-gradient(135deg,#6a9ba0,#517d84)]' : 'w-2 bg-[#d8e8e6]'
                }`}
              />
            ))}
          </div>

          <div className="mt-5 rounded-[1.55rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,249,247,0.84))] px-4 py-4 shadow-[0_16px_34px_rgba(86,126,134,0.08)] sm:px-5">
            <h2 className="text-[1.65rem] font-semibold tracking-tight text-slate-800 sm:text-[1.85rem]">
              {current.title}
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-700">{current.content}</p>
          </div>
        </div>

        <div className="relative flex flex-col gap-3 border-t border-[#e7f0ef] bg-white/62 px-5 pb-5 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
            className="mist-secondary-button inline-flex items-center justify-center gap-1 rounded-full px-3.5 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            上一步
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onFinish}
              className="rounded-full px-3.5 py-2 text-sm text-slate-500 transition hover:bg-white/72"
            >
              跳过
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="mist-primary-button inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-sm"
              >
                下一步
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                className="mist-primary-button rounded-full px-4 py-2 text-sm"
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
