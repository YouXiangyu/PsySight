import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { NoticeTone } from '@/shared/ui/request-state';

interface NoticeBannerProps {
  title: string;
  description: string;
  tone?: NoticeTone;
  className?: string;
}

const toneStyles: Record<NoticeTone, string> = {
  success: 'border-[#d8ebe7] bg-[#f1f8f7] text-[#456f74]',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function NoticeBanner({
  title,
  description,
  tone = 'success',
  className = '',
}: NoticeBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneStyles[tone]} ${className}`}>
      <p className="flex items-center gap-2 font-semibold">
        {tone === 'danger' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        {title}
      </p>
      <p className="mt-1 leading-6">{description}</p>
    </div>
  );
}
