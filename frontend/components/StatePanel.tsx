import type { ReactNode } from 'react';

type StateTone = 'default' | 'warning' | 'danger';

const toneStyles: Record<StateTone, string> = {
  default: 'border-[#d9ebe7] bg-white/92 text-slate-600',
  warning: 'border-amber-200 bg-amber-50/95 text-amber-800',
  danger: 'border-rose-200 bg-rose-50/95 text-rose-800',
};

const iconStyles: Record<StateTone, string> = {
  default: 'bg-[#eef6f5] text-[#517d84]',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
};

interface StatePanelProps {
  icon?: ReactNode;
  title: string;
  description: string;
  tone?: StateTone;
  actions?: ReactNode;
  className?: string;
}

export default function StatePanel({
  icon,
  title,
  description,
  tone = 'default',
  actions,
  className = '',
}: StatePanelProps) {
  return (
    <div className={`rounded-[1.6rem] border px-5 py-5 shadow-[0_12px_28px_rgba(86,126,134,0.06)] ${toneStyles[tone]} ${className}`}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconStyles[tone]}`}>{icon}</div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-sm leading-6">{description}</p>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
