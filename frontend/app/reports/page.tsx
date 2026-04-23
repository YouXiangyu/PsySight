'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { BarChart3, CalendarDays, FileText, RefreshCcw, ShieldCheck } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import LoadingPanel from '@/components/LoadingPanel';
import StatePanel from '@/components/StatePanel';
import ReportsGrid from '@/features/reports/components/ReportsGrid';
import { useReportsPage } from '@/features/reports/hooks/useReportsPage';
import { commonCopy, reportsCopy } from '@/shared/copy/app-copy';

const reportTags = ['历史测评归档', '统计可见性可控', '随时回看分析结果'];

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
    <div className="rounded-[1.35rem] border border-white/70 bg-white/88 p-3.5 shadow-[0_16px_32px_rgba(86,126,134,0.08)] sm:rounded-[1.5rem] sm:p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[1.15rem] bg-[#e7f1f1] text-[#4a7a80] sm:h-10 sm:w-10 sm:rounded-2xl">{icon}</div>
      <p className="mt-3 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">{value}</p>
    </div>
  );
}

function formatReportDate(value: string | null) {
  if (!value) {
    return '暂无';
  }

  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export default function ReportsPage() {
  const { loading, authenticated, items, updatingId, errorMsg, handleToggleVisibility, reload } = useReportsPage();

  const totalReports = items.length;
  const visibleInStatsCount = items.filter((item) => !item.hidden_from_stats).length;
  const focusReportCount = items.filter((item) => /(中|重)/.test(item.severity_level || '')).length;

  const latestReportDate = useMemo(() => {
    if (!items.length) {
      return '暂无';
    }

    const latest = items.reduce((current, item) =>
      new Date(item.created_at).getTime() > new Date(current.created_at).getTime() ? item : current
    );

    return formatReportDate(latest.created_at);
  }, [items]);

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
                  <FileText size={14} />
                  心理测评报告档案
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h1 className="text-[2rem] font-semibold tracking-tight text-slate-800 md:text-[2.4rem]">
                    {reportsCopy.title}
                  </h1>
                  <Link href="/chat" className="mist-link text-sm">
                    {commonCopy.actions.backToChat}
                  </Link>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-[15px]">
                  {reportsCopy.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {reportTags.map((tag) => (
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
                <SummaryCard label="已保存报告" value={`${totalReports}`} icon={<FileText size={18} />} />
                <SummaryCard label="参与匿名统计" value={`${visibleInStatsCount}`} icon={<BarChart3 size={18} />} />
                <SummaryCard label="最近更新" value={latestReportDate} icon={<CalendarDays size={18} />} />
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="mist-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                    <ShieldCheck size={14} />
                    使用说明
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-800">在这里统一管理你的测评结果</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    你可以回看历史报告、查看风险等级和得分摘要，也可以决定每份报告是否参与匿名统计汇总。
                  </p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f1ef] text-[#4a7a80] md:flex">
                  <ShieldCheck size={22} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[1.5rem] bg-[#f4faf9] px-4 py-4">
                  <p className="text-xs text-slate-400">重点关注报告</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{focusReportCount}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">按当前分级中含“中”或“重”的报告数量统计。</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f7f9fc] px-4 py-4">
                  <p className="text-xs text-slate-400">已隐藏统计</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{totalReports - visibleInStatsCount}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">这些报告不会出现在匿名统计页的公开汇总中。</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#fbfaf6] px-4 py-4">
                  <p className="text-xs text-slate-400">回看建议</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">优先查看最近一次报告</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">结合近期状态变化，重新理解当前压力和情绪轨迹。</p>
                </div>
              </div>
            </div>

            <div className="mist-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4f7] px-3 py-1 text-xs font-medium text-[#597590]">
                <BarChart3 size={14} />
                可见性说明
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-800">报告会如何出现在统计中</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                参与匿名统计的报告只会用于整体趋势展示，不会公开你的身份信息。你可以在每张卡片上随时切换显示状态。
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-[1.5rem] border border-[#d8e8e5] bg-[#f7fbfb] px-4 py-4">
                  <p className="text-xs text-slate-400">当前参与统计</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{visibleInStatsCount}</p>
                </div>
                <div className="rounded-[1.5rem] border border-[#e3ebef] bg-white/88 px-4 py-4 text-sm leading-6 text-slate-500">
                  建议优先保留对整体趋势判断有帮助的报告，若你更希望完全私密，也可以单独隐藏任意一份报告。
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                  <FileText size={14} />
                  报告清单
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-800">逐份查看你的测评记录</h2>
                <p className="mt-1 text-sm text-slate-500">
                  每张报告卡片会展示量表名称、得分、分级、结果提示，以及是否参与匿名统计。
                </p>
              </div>
              <div className="w-full rounded-[1.15rem] border border-white/75 bg-white/88 px-4 py-2.5 text-sm text-slate-500 shadow-[0_12px_24px_rgba(86,126,134,0.06)] sm:w-auto sm:rounded-full sm:py-2">
                共 <span className="font-semibold text-slate-800">{totalReports}</span> 份报告，
                其中 <span className="font-semibold text-slate-800">{visibleInStatsCount}</span> 份参与统计
              </div>
            </div>

            {loading ? (
              <LoadingPanel className="mt-6" message={reportsCopy.loading} />
            ) : !authenticated ? (
              <div className="mt-6">
                <StatePanel
                  title={reportsCopy.loginRequiredTitle}
                  description={reportsCopy.loginRequiredDescription}
                  actions={
                    <Link href="/" className="mist-primary-button inline-flex rounded-full px-4 py-2 text-xs font-semibold">
                      {commonCopy.actions.goToLogin}
                    </Link>
                  }
                />
              </div>
            ) : errorMsg && !items.length ? (
              <div className="mt-6">
                <StatePanel
                  title={reportsCopy.loadErrorTitle}
                  description={errorMsg}
                  tone="danger"
                  actions={
                    <button
                      type="button"
                      onClick={() => void reload()}
                      className="mist-primary-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                    >
                      <RefreshCcw size={14} />
                      {commonCopy.actions.reload}
                    </button>
                  }
                />
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6">
                <StatePanel
                  title={reportsCopy.emptyTitle}
                  description={reportsCopy.emptyDescription}
                  actions={
                    <Link href="/scales" className="mist-primary-button inline-flex rounded-full px-4 py-2 text-xs font-semibold">
                      {commonCopy.actions.goToScales}
                    </Link>
                  }
                />
              </div>
            ) : (
              <>
                {errorMsg ? (
                  <div className="mt-4">
                    <StatePanel title={reportsCopy.partialErrorTitle} description={errorMsg} tone="danger" />
                  </div>
                ) : null}
                <ReportsGrid items={items} updatingId={updatingId} onToggleVisibility={handleToggleVisibility} />
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
