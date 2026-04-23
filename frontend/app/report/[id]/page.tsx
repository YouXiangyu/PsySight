'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import LoadingPanel from '@/components/LoadingPanel';
import StatePanel from '@/components/StatePanel';
import StatsBoard from '@/features/stats/components/StatsBoard';
import { useReportDetail } from '@/features/report/hooks/useReportDetail';
import { commonCopy } from '@/shared/copy/app-copy';
import { reportDetailCopy } from '@/shared/copy/report-detail-copy';

function SummaryCard({
  label,
  value,
  icon,
  accent = 'default',
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: 'default' | 'soft' | 'warning';
}) {
  const accentStyle =
    accent === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : accent === 'soft'
        ? 'bg-[#f4faf9] border-[#d8ebe7] text-[#456f74]'
        : 'bg-white/90 border-white/80 text-slate-800';

  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 shadow-[0_16px_32px_rgba(86,126,134,0.08)] ${accentStyle}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-[#4a7a80]">{icon}</div>
      <p className="mt-3 text-xs opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SectionShell({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mist-panel rounded-[2rem] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f1f1] text-[#406f76]">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetaItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#ddeaea] bg-white/88 px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">{icon}{label}</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function EmotionBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(Number(value) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-white">
        <div className="h-full rounded-full bg-[linear-gradient(135deg,#6a9ba0,#517d84)]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function getSeverityAccent(level: string) {
  if (level.includes('重')) {
    return 'warning' as const;
  }

  if (level.includes('中')) {
    return 'soft' as const;
  }

  return 'default' as const;
}

function formatDate(value?: string | null) {
  if (!value) {
    return new Date().toLocaleDateString('zh-CN');
  }

  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export default function ReportPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const reportId = Number(Array.isArray(id) ? id[0] : id);
  const chatSession = searchParams.get('session');
  const homeHref = chatSession ? `/chat?session=${encodeURIComponent(chatSession)}` : '/chat';
  const { record, stats, loading, errorMsg, subjectName } = useReportDetail(reportId);

  if (loading) {
    return (
      <div className="mist-page flex min-h-screen items-center justify-center px-4">
        <div className="mist-container w-full max-w-md">
          <LoadingPanel message={reportDetailCopy.loading} />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <main className="mist-page px-4 py-6 md:px-8 md:py-10">
        <div className="mist-container mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link href={homeHref} className="mist-link inline-flex items-center text-sm">
              <ArrowLeft size={18} className="mr-1" />
              {commonCopy.actions.backToChat}
            </Link>
          </div>
          <StatePanel
            tone="danger"
            icon={<ShieldAlert size={18} />}
            title={reportDetailCopy.reportContent.emptyTitle}
            description={errorMsg || reportDetailCopy.reportContent.emptyDescription}
            actions={
              <Link href={homeHref} className="mist-primary-button inline-flex rounded-full px-4 py-2 text-xs font-semibold">
                {commonCopy.actions.backToChat}
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const severity = record.severity_level || reportDetailCopy.metrics.severityFallback;
  const emotionConsentLabel = record.emotion_consent
    ? reportDetailCopy.metrics.consentEnabled
    : reportDetailCopy.metrics.consentDisabled;
  const hasEmotionLog = record.emotion_consent && record.emotion_log && Object.keys(record.emotion_log).length > 0;

  return (
    <main className="mist-page px-4 py-6 md:px-8 md:py-10">
      <div className="mist-container mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={homeHref} className="mist-link inline-flex items-center text-sm">
            <ArrowLeft size={18} className="mr-1" />
            {commonCopy.actions.backToChat}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="mist-secondary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Download size={16} />
            {reportDetailCopy.actions.savePdf}
          </button>
        </div>

        <section className="mist-panel relative overflow-hidden rounded-[2.25rem] px-6 py-6 md:px-7 md:py-7">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(166,210,205,0.42),transparent_70%)]" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(188,210,226,0.42),transparent_72%)]" />
          <div className="relative grid gap-5 lg:grid-cols-[1.45fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                <ShieldCheck size={14} />
                {reportDetailCopy.hero.badge}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-800 md:text-[2.35rem]">
                {reportDetailCopy.hero.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-[15px]">
                {reportDetailCopy.hero.description}
              </p>
              <div className="mt-5 inline-flex rounded-full border border-white/75 bg-white/82 px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_10px_24px_rgba(86,126,134,0.06)]">
                {reportDetailCopy.hero.encouragement}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <SummaryCard
                label={reportDetailCopy.metrics.totalScore}
                value={String(record.total_score ?? '-')}
                icon={<Activity size={18} />}
                accent="soft"
              />
              <SummaryCard
                label={reportDetailCopy.metrics.severity}
                value={severity}
                icon={<ShieldAlert size={18} />}
                accent={getSeverityAccent(severity)}
              />
              <SummaryCard
                label={reportDetailCopy.metrics.emotionConsent}
                value={emotionConsentLabel}
                icon={<Sparkles size={18} />}
              />
            </div>
          </div>
        </section>

        {record.urgent_recommendation ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-5 shadow-[0_16px_32px_rgba(190,80,80,0.08)]">
            <div className="flex items-center gap-2 font-semibold text-rose-700">
              <ShieldAlert size={18} />
              {reportDetailCopy.urgent.title}
            </div>
            <p className="mt-2 text-sm leading-7 text-rose-700">{record.urgent_recommendation}</p>
            <p className="mt-2 text-xs leading-6 text-rose-600">{reportDetailCopy.urgent.helperText}</p>
          </div>
        ) : null}

        {errorMsg ? (
          <StatePanel tone="danger" icon={<ShieldAlert size={18} />} title={reportDetailCopy.fallbackErrors.load} description={errorMsg} />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="space-y-6">
            <SectionShell
              title={reportDetailCopy.reportContent.title}
              description={reportDetailCopy.reportContent.description}
              icon={<FileText size={20} />}
            >
              {record.score_explanation ? (
                <div className="mb-5 rounded-[1.5rem] border border-[#d9ebe7] bg-[#f2f8f7] px-4 py-4 text-sm text-[#3c666b]">
                  <p className="font-semibold">{reportDetailCopy.scoreExplanation.title}</p>
                  <p className="mt-2 leading-7">{record.score_explanation}</p>
                </div>
              ) : null}

              <article className="rounded-[1.6rem] border border-[#ddeaea] bg-white/92 px-5 py-5 shadow-[0_16px_32px_rgba(86,126,134,0.06)]">
                <div className="whitespace-pre-wrap text-sm leading-8 text-slate-700 md:text-[15px]">{record.ai_report}</div>
              </article>
            </SectionShell>

            {stats ? (
              <SectionShell
                title={reportDetailCopy.stats.title}
                description={reportDetailCopy.stats.description}
                icon={<Activity size={20} />}
              >
                <StatsBoard stats={stats} />
              </SectionShell>
            ) : null}
          </div>

          <aside className="space-y-6">
            <SectionShell
              title="报告概览"
              description="快速查看本次报告的身份、完成时间和测评类型。"
              icon={<User size={20} />}
            >
              <div className="space-y-3">
                <MetaItem label={reportDetailCopy.meta.subject} value={subjectName} icon={<User size={13} />} />
                <MetaItem
                  label={reportDetailCopy.meta.completedAt}
                  value={formatDate(record.created_at)}
                  icon={<CalendarDays size={13} />}
                />
                <MetaItem
                  label={reportDetailCopy.meta.assessmentType}
                  value={record.scale?.title || reportDetailCopy.meta.aiComposite}
                  icon={<FileText size={13} />}
                />
              </div>
            </SectionShell>

            <SectionShell
              title={reportDetailCopy.emotionSection.title}
              description={reportDetailCopy.emotionSection.description}
              icon={<Sparkles size={20} />}
            >
              {hasEmotionLog ? (
                <div className="space-y-3">
                  {Object.entries(record.emotion_log).map(([key, value]) => (
                    <EmotionBar key={key} label={key} value={Number(value)} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-[#ddeaea] bg-white/88 px-4 py-4 text-sm text-slate-500">
                  <p className="font-medium text-slate-700">{reportDetailCopy.emotionSection.emptyTitle}</p>
                  <p className="mt-2 leading-6">{reportDetailCopy.emotionSection.emptyDescription}</p>
                </div>
              )}
            </SectionShell>

            <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50 px-5 py-5 shadow-[0_14px_28px_rgba(180,140,60,0.06)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <ShieldCheck size={16} />
                {reportDetailCopy.disclaimer.title}
              </div>
              <p className="mt-2 text-xs leading-7 text-amber-800">{reportDetailCopy.disclaimer.description}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
