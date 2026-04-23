'use client';

import AppHeader from '@/components/AppHeader';
import StatePanel from '@/components/StatePanel';
import StatsBoard from '@/features/stats/components/StatsBoard';
import StatsBoardSkeleton from '@/features/stats/components/StatsBoardSkeleton';
import { commonCopy, statsCopy } from '@/shared/copy/app-copy';
import { getErrorMessage } from '@/shared/ui/request-state';
import { getStatsSummary, type StatsSummary } from '@/lib/api';
import { Activity, AlertCircle, BarChart3, Globe2, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

const highlightTags = ['单页联展', '量表使用排行', '匿名样本趋势'];

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="mist-bubble-card rounded-[1.35rem] p-3.5 sm:rounded-[1.5rem] sm:p-4">
      <div className="mist-bubble-card flex h-9 w-9 items-center justify-center rounded-[1.15rem] p-0 text-[#4a7a80] shadow-[0_10px_24px_rgba(86,126,134,0.06)] sm:h-10 sm:w-10 sm:rounded-2xl">
        {icon}
      </div>
      <p className="mt-3 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">{value}</p>
    </div>
  );
}

const hasUsableStats = (stats: StatsSummary | null) => {
  if (!stats) {
    return false;
  }

  return (
    stats.based_on_n > 0 ||
    (stats.cards?.length || 0) > 0 ||
    (stats.overview?.cards?.length || 0) > 0 ||
    (stats.demographics?.age_groups?.length || 0) > 0 ||
    (stats.demographics?.genders?.length || 0) > 0 ||
    (stats.demographics?.regions?.length || 0) > 0 ||
    (stats.demographics?.participants?.length || 0) > 0 ||
    (stats.wordcloud?.length || 0) > 0 ||
    (stats.scale_usage?.length || 0) > 0
  );
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getStatsSummary();
      setStats(result);
    } catch (loadError) {
      setStats(null);
      setError(getErrorMessage(loadError, statsCopy.loadErrorDescription));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const isEmpty = useMemo(() => !loading && !error && !hasUsableStats(stats), [error, loading, stats]);

  const scaleUsageCount = stats?.scale_usage?.length || 0;
  const participantCount = stats?.demographics?.participants?.length || 0;

  return (
    <div className="mist-page min-h-screen">
      <div className="mist-container min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
          <section className="mist-panel relative overflow-hidden rounded-[1.8rem] px-4 py-5 sm:rounded-[2.2rem] sm:px-6 sm:py-6 md:px-7 md:py-7">
            <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(166,210,205,0.45),transparent_70%)]" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(188,210,226,0.45),transparent_72%)]" />
            <div className="relative grid gap-4 sm:gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                  <BarChart3 size={14} />
                  数据总览工作台
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h1 className="text-[2rem] font-semibold tracking-tight text-slate-800 md:text-[2.4rem]">
                    {statsCopy.title}
                  </h1>
                  <Link href="/chat" className="mist-link text-sm">
                    {commonCopy.actions.backToChat}
                  </Link>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-[15px]">
                  {statsCopy.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {highlightTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/75 bg-white/82 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-[0_10px_24px_rgba(86,126,134,0.06)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <SummaryCard
                  label="公开样本数"
                  value={loading ? '-' : `${stats?.based_on_n || 0}`}
                  icon={<Activity size={18} />}
                />
                <SummaryCard
                  label="量表排行条目"
                  value={loading ? '-' : `${scaleUsageCount}`}
                  icon={<BarChart3 size={18} />}
                />
                <SummaryCard
                  label="近期参与样本"
                  value={loading ? '-' : `${participantCount}`}
                  icon={<Globe2 size={18} />}
                />
              </div>
            </div>
          </section>

          <div className="mt-5">
            {loading ? (
              <StatsBoardSkeleton />
            ) : error ? (
              <StatePanel
                icon={<AlertCircle size={18} />}
                title={statsCopy.loadErrorTitle}
                description={error}
                tone="danger"
                actions={
                  <button
                    type="button"
                    onClick={() => void loadStats()}
                    className="mist-primary-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    <RefreshCcw size={14} />
                    {commonCopy.actions.reload}
                  </button>
                }
              />
            ) : isEmpty ? (
              <StatePanel
                icon={<BarChart3 size={18} />}
                title={statsCopy.emptyTitle}
                description={statsCopy.emptyDescription}
                actions={
                  <>
                    <Link href="/scales" className="mist-primary-button inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold">
                      {commonCopy.actions.goToScales}
                    </Link>
                    <Link href="/chat" className="mist-secondary-button inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold">
                      {commonCopy.actions.backToChat}
                    </Link>
                  </>
                }
              />
            ) : (
              <StatsBoard stats={stats!} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
