'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, FileText, Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { getMe, getMyReports, setReportStatsVisibility } from '@/lib/api';

type ReportItem = Awaited<ReturnType<typeof getMyReports>>['items'][number];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReports = async () => {
    const data = await getMyReports({ limit: 100 });
    setItems(data.items);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const me = await getMe();
        setAuthenticated(me.authenticated);
        if (!me.authenticated) return;
        await loadReports();
      } catch (error) {
        setErrorMsg((error as Error).message || '加载报告失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggleVisibility = async (item: ReportItem) => {
    setUpdatingId(item.id);
    setErrorMsg('');
    try {
      await setReportStatsVisibility(item.id, !item.hidden_from_stats);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, hidden_from_stats: !row.hidden_from_stats } : row
        )
      );
    } catch (error) {
      setErrorMsg((error as Error).message || '更新统计可见性失败');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">我的测评报告</h1>
            <p className="text-sm text-slate-500 mt-1">查看历史测评，并控制是否计入匿名统计看板。</p>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">
            返回首页
          </Link>
        </div>

        {!!errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mr-2" size={16} />
            正在加载报告...
          </div>
        ) : !authenticated ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">登录后即可查看你的历史测评报告。</p>
            <Link
              href="/auth"
              className="inline-flex mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              去登录 / 注册
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            你还没有历史报告，先去做一次量表测评吧。
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.scale.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    #{item.id}
                  </span>
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
                    onClick={() => handleToggleVisibility(item)}
                    disabled={updatingId === item.id}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    title={item.hidden_from_stats ? '恢复到匿名统计' : '从匿名统计隐藏'}
                  >
                    {item.hidden_from_stats ? <Eye size={14} /> : <EyeOff size={14} />}
                    {updatingId === item.id
                      ? '更新中...'
                      : item.hidden_from_stats
                      ? '恢复统计展示'
                      : '从统计中隐藏'}
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
        )}
      </main>
    </div>
  );
}
