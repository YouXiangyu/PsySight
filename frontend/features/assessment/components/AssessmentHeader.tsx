import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

const FaceMonitor = dynamic(() => import('@/components/FaceMonitor'), { ssr: false });

interface AssessmentHeaderProps {
  scale: any;
  emotionEnabled: boolean;
  onToggleEmotion: () => void;
  onEmotionUpdate: (data: Record<string, number>) => void;
  onReturnHome: () => void;
}

export default function AssessmentHeader({
  scale,
  emotionEnabled,
  onToggleEmotion,
  onEmotionUpdate,
  onReturnHome,
}: AssessmentHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <button
        type="button"
        onClick={onReturnHome}
        className="mist-secondary-button inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm sm:w-auto"
      >
        <ArrowLeft size={16} />
        返回聊天室
      </button>

      <div className="mist-panel flex flex-col gap-4 rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{scale.title}</h1>
          <p className="mt-1 text-sm leading-7 text-slate-500">{scale.description}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:w-auto md:flex-col md:items-end md:justify-end">
          <FaceMonitor enabled={emotionEnabled} onEmotionUpdate={onEmotionUpdate} />
          <button
            onClick={onToggleEmotion}
            className={`w-full rounded-full px-4 py-2 text-xs sm:w-auto sm:py-1.5 ${
              emotionEnabled ? 'bg-[#517d84] text-white' : 'border border-slate-200 bg-white/85 text-slate-600'
            }`}
          >
            {emotionEnabled ? '关闭情绪感知' : '开启情绪感知'}
          </button>
        </div>
      </div>
    </div>
  );
}
