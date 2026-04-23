import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Eye,
  EyeOff,
  FileText,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { commonCopy, reportsCopy } from '@/shared/copy/app-copy';
import type { ReportItem } from '../hooks/useReportsPage';

interface ReportsGridProps {
  items: ReportItem[];
  updatingId: number | null;
  onToggleVisibility: (item: ReportItem) => void;
}

function getSeverityStyle(level: string) {
  if (level.includes('重')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  if (level.includes('中')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  if (level.includes('轻')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getCategoryStyle(name: string) {
  const value = name.toLowerCase();

  if (value.includes('睡眠')) {
    return 'bg-[#e6f3f0] text-[#356b73]';
  }

  if (value.includes('焦虑') || value.includes('抑郁') || value.includes('情绪')) {
    return 'bg-[#eaf1f7] text-[#496b89]';
  }

  if (value.includes('人格') || value.includes('关系')) {
    return 'bg-[#f4efe6] text-[#806347]';
  }

  return 'bg-[#edf4f4] text-[#4a787c]';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export default function ReportsGrid({ items, updatingId, onToggleVisibility }: ReportsGridProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const isUpdating = updatingId === item.id;
        const isHidden = item.hidden_from_stats;
        const categoryStyle = getCategoryStyle(item.scale.category || '测评报告');
        const severityStyle = getSeverityStyle(item.severity_level || reportsCopy.card.severityFallback);

        return (
          <article
            key={item.id}
            className="mist-panel group rounded-[1.65rem] p-4 transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.85rem] sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${categoryStyle}`}>
                  {item.scale.category || '测评报告'}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-400 shadow-sm">
                  {item.scale.code.toUpperCase()}
                </span>
              </div>
              <span className="rounded-full bg-[#eef6f5] px-2.5 py-1 text-[11px] text-slate-600">#{item.id}</span>
            </div>

            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold leading-7 text-slate-800">{item.scale.title}</h3>
                <ArrowUpRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:text-[#4f8085]" />
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f7fbfb] px-3 py-1.5 text-xs text-slate-500">
                <CalendarDays size={14} className="text-[#5c8b90]" />
                {formatDate(item.created_at)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[#d9ebe7] bg-[#f4faf9] px-4 py-4">
                <p className="text-[11px] text-slate-400">{reportsCopy.card.scoreLabel}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-800">{item.total_score ?? '-'}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white/88 px-4 py-4">
                <p className="text-[11px] text-slate-400">{reportsCopy.card.severityLabel}</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyle}`}
                >
                  {item.severity_level || reportsCopy.card.severityFallback}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-[#ddeaea] bg-white/88 px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Activity size={13} />
                结果提示
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.score_explanation}</p>
            </div>

            <div
              className={`mt-4 rounded-[1.35rem] border px-4 py-3 text-sm ${
                isHidden
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : 'border-[#d9ebe7] bg-[#f4faf9] text-[#456f74]'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {isHidden ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                {isHidden ? '当前未参与匿名统计' : '当前参与匿名统计'}
              </div>
              <p className="mt-1 text-xs leading-5 opacity-90">
                {isHidden ? '这份报告不会进入统计页的公开汇总。' : '这份报告会被纳入匿名化后的整体趋势统计。'}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <LoadingButton
                type="button"
                onClick={() => onToggleVisibility(item)}
                loading={isUpdating}
                loadingText={reportsCopy.card.updatingVisibility}
                icon={isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                className="mist-secondary-button inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs sm:w-auto"
                title={isHidden ? reportsCopy.card.restoreTitle : reportsCopy.card.hideTitle}
              >
                {isHidden ? reportsCopy.card.restoreToStats : reportsCopy.card.hiddenFromStats}
              </LoadingButton>

              <Link
                href={`/report/${item.id}`}
                className="mist-primary-button inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs sm:w-auto"
              >
                <FileText size={14} />
                {commonCopy.actions.viewReport}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
