import Link from 'next/link';
import { Eye, EyeOff, FileText } from 'lucide-react';
import type { ReportItem } from '../hooks/useReportsPage';

interface ReportsGridProps {
  items: ReportItem[];
  updatingId: number | null;
  onToggleVisibility: (item: ReportItem) => void;
}

export default function ReportsGrid({ items, updatingId, onToggleVisibility }: ReportsGridProps) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.scale.title}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">#{item.id}</span>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <p className="text-slate-600">
              总分：<span className="font-semibold text-slate-800">{item.total_score ?? '-'}</span>
            </p>
            <p className="text-slate-600">
              严重程度：<span className="font-semibold text-indigo-700">{item.severity_level || '待评估'}</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onToggleVisibility(item)}
              disabled={updatingId === item.id}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              title={item.hidden_from_stats ? '恢复到匿名统计' : '从匿名统计隐藏'}
            >
              {item.hidden_from_stats ? <Eye size={14} /> : <EyeOff size={14} />}
              {updatingId === item.id ? '更新中...' : item.hidden_from_stats ? '恢复统计展示' : '从统计中隐藏'}
            </button>
            <Link
              href={`/report/${item.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
            >
              <FileText size={14} />
              查看报告
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
