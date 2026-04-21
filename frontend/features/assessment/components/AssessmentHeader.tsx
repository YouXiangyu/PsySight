import { ArrowLeft } from 'lucide-react';

import FaceMonitor from '@/components/FaceMonitor';

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
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        <ArrowLeft size={16} />
        返回首页
      </button>

      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{scale.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{scale.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FaceMonitor enabled={emotionEnabled} onEmotionUpdate={onEmotionUpdate} />
          <button
            onClick={onToggleEmotion}
            className={`text-xs px-3 py-1.5 rounded-lg border ${
              emotionEnabled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {emotionEnabled ? '关闭情绪感知' : '开启情绪感知'}
          </button>
        </div>
      </div>
    </div>
  );
}
