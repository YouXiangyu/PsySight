'use client';

import { useMemo, type ReactNode } from 'react';
import { Activity, BarChart3, Cloud, Layers3, MapPin, Sparkles, TrendingUp, Users } from 'lucide-react';
import StatePanel from '@/components/StatePanel';
import { commonCopy, statsCopy } from '@/shared/copy/app-copy';
import type { StatsSummary } from '@/shared/api';

type AccentTone = 'teal' | 'blue' | 'sand';

const moduleShellClass =
  'mist-panel-bubble rounded-[1.85rem] px-4 py-4 sm:rounded-[2.15rem] sm:px-5 sm:py-5 md:rounded-[2.45rem] md:px-7 md:py-7';

const subBubbleClass =
  'mist-bubble-card rounded-[1.35rem] px-4 py-4 sm:rounded-[1.75rem] sm:px-5 sm:py-5';

const softInsetClass =
  'mist-bubble-card-soft rounded-[1.4rem] px-4 py-4 sm:rounded-[1.8rem] sm:px-5 sm:py-5';

function getAccentText(accent: AccentTone) {
  if (accent === 'blue') {
    return 'text-[#5c7791]';
  }

  if (accent === 'sand') {
    return 'text-[#8a6e46]';
  }

  return 'text-[#517d84]';
}

function getAccentBar(accent: AccentTone) {
  if (accent === 'blue') {
    return 'bg-[linear-gradient(135deg,#7b9bb8,#5a7692)]';
  }

  if (accent === 'sand') {
    return 'bg-[linear-gradient(135deg,#c7a777,#9e7f52)]';
  }

  return 'bg-[linear-gradient(135deg,#6a9ba0,#517d84)]';
}

function getBadgeTone(accent: AccentTone) {
  if (accent === 'blue') {
    return 'bg-[#edf4fb] text-[#5b7691]';
  }

  if (accent === 'sand') {
    return 'bg-[#f8f2e8] text-[#846846]';
  }

  return 'bg-[#eef6f5] text-[#4a7c81]';
}

function PercentBar({
  label,
  value,
  maxValue,
  accent = 'teal',
}: {
  label: string;
  value: number;
  maxValue: number;
  accent?: AccentTone;
}) {
  const width = maxValue > 0 ? Math.max(8, Math.round((value / maxValue) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/70">
        <div className={`h-full rounded-full ${getAccentBar(accent)}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SectionShell({
  icon,
  title,
  description,
  badge,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section className={moduleShellClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="mist-bubble-card flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] p-0 text-[#406f76] shadow-[0_10px_24px_rgba(86,126,134,0.06)] sm:h-12 sm:w-12 sm:rounded-[1.4rem]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="inline-flex rounded-full bg-[#eef6f5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#62858a]">
            {badge}
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

function BubbleCard({
  eyebrow,
  title,
  value,
  accent = 'teal',
}: {
  eyebrow: string;
  title: string;
  value: string;
  accent?: AccentTone;
}) {
  return (
    <article className={subBubbleClass}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{title}</p>
      <p className={`mt-4 text-2xl font-semibold tracking-tight sm:text-3xl ${getAccentText(accent)}`}>{value}</p>
    </article>
  );
}

function InsightCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <div className={subBubbleClass}>
      <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-[#eef6f5] text-[#517d84] sm:h-11 sm:w-11 sm:rounded-2xl">{icon}</div>
      <p className="mt-4 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
    </div>
  );
}

function StatsEmpty({ title }: { title: string }) {
  return (
    <StatePanel
      title={title}
      description={commonCopy.emptyStateDescription}
      className="mist-bubble-card rounded-[1.75rem] shadow-none"
    />
  );
}

function getWordBackground(index: number) {
  const backgrounds = ['rgba(255,255,255,0.88)', 'rgba(242,248,247,0.95)', 'rgba(238,244,247,0.95)', 'rgba(249,245,238,0.95)'];
  return backgrounds[index % backgrounds.length];
}

export default function StatsBoard({ stats }: { stats: StatsSummary }) {
  const cards = stats.overview?.cards || stats.cards || [];
  const ageGroups = stats.demographics?.age_groups || [];
  const genders = stats.demographics?.genders || [];
  const regions = stats.demographics?.regions || [];
  const participants = stats.demographics?.participants || [];
  const words = stats.wordcloud || [];
  const scaleUsage = stats.scale_usage || [];

  const ageMax = useMemo(() => Math.max(0, ...ageGroups.map((item) => item.value)), [ageGroups]);
  const genderMax = useMemo(() => Math.max(0, ...genders.map((item) => item.value)), [genders]);
  const regionMax = useMemo(() => Math.max(0, ...regions.map((item) => item.value)), [regions]);
  const scaleUsageMax = useMemo(() => Math.max(0, ...scaleUsage.map((item) => item.count)), [scaleUsage]);
  const maxWordWeight = useMemo(() => Math.max(0, ...words.map((item) => item.weight)), [words]);
  const totalScaleUsage = useMemo(() => scaleUsage.reduce((sum, item) => sum + item.count, 0), [scaleUsage]);

  const topAge = ageGroups.reduce<{ label: string; value: number } | null>(
    (best, item) => (!best || item.value > best.value ? item : best),
    null
  );
  const topGender = genders.reduce<{ label: string; value: number } | null>(
    (best, item) => (!best || item.value > best.value ? item : best),
    null
  );
  const topRegion = regions.reduce<{ label: string; value: number } | null>(
    (best, item) => (!best || item.value > best.value ? item : best),
    null
  );
  const topWord = words.reduce<{ text: string; weight: number } | null>(
    (best, item) => (!best || item.weight > best.weight ? item : best),
    null
  );
  const topScale = scaleUsage.reduce<{ title: string; count: number } | null>(
    (best, item) => (!best || item.count > best.count ? { title: item.title, count: item.count } : best),
    null
  );

  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <section className={moduleShellClass}>
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#406f76]">
              <Activity size={14} />
              {statsCopy.hero.badge(stats.based_on_n)}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-800 md:text-[2rem]">{statsCopy.hero.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{statsCopy.hero.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <BubbleCard eyebrow="高频年龄段" title={statsCopy.hero.topAge} value={topAge?.label || statsCopy.hero.noData} />
            <BubbleCard eyebrow="高频性别" title={statsCopy.hero.topGender} value={topGender?.label || statsCopy.hero.noData} accent="blue" />
            <BubbleCard eyebrow="高频地区" title={statsCopy.hero.topRegion} value={topRegion?.label || statsCopy.hero.noData} accent="sand" />
            <BubbleCard eyebrow="关键词" title={statsCopy.hero.topWord} value={topWord?.text || statsCopy.hero.noData} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          label="快速洞察"
          value={topScale?.title || '暂无数据'}
          note={topScale ? `当前最高频量表共完成 ${topScale.count} 次。` : '等待更多样本后，这里会显示最受关注的量表。'}
          icon={<TrendingUp size={18} />}
        />
        <InsightCard
          label="参与轮廓"
          value={topRegion?.label || '暂无数据'}
          note={topRegion ? `当前样本中最常见地区为 ${topRegion.label}。` : '等待更多公开样本后，这里会展示更清晰的地区特征。'}
          icon={<MapPin size={18} />}
        />
        <InsightCard
          label="高频主题"
          value={topWord?.text || '暂无数据'}
          note={topWord ? `“${topWord.text}”在当前词云中出现频率最高。` : '当前还没有足够的关键词聚合数据。'}
          icon={<Cloud size={18} />}
        />
      </section>

      <SectionShell
        icon={<BarChart3 size={20} />}
        title={statsCopy.overview.title}
        description={statsCopy.overview.description}
        badge="Overview"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.length ? (
            cards.map((card, index) => (
              <BubbleCard
                key={card.label}
                eyebrow={`指标 ${index + 1}`}
                title={card.label}
                value={card.value}
                accent={index % 3 === 1 ? 'blue' : index % 3 === 2 ? 'sand' : 'teal'}
              />
            ))
          ) : (
            <div className="md:col-span-3">
              <StatsEmpty title={statsCopy.overview.emptyTitle} />
            </div>
          )}
        </div>
      </SectionShell>

      <SectionShell
        icon={<Layers3 size={20} />}
        title={statsCopy.scaleUsage.title}
        description={statsCopy.scaleUsage.description}
        badge="Scale Usage"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {scaleUsage.length ? (
            scaleUsage.map((item, index) => {
              const percent = totalScaleUsage > 0 ? Math.round((item.count / totalScaleUsage) * 100) : 0;

              return (
                <div key={`${item.code || item.title}-${index}`} className={subBubbleClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getBadgeTone(index % 3 === 1 ? 'blue' : index % 3 === 2 ? 'sand' : 'teal')}`}>
                        {statsCopy.scaleUsage.topLabel(index)}
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.category || item.code || statsCopy.scaleUsage.fallbackCategory}
                      </p>
                    </div>
                    <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getBadgeTone(index % 3 === 1 ? 'blue' : index % 3 === 2 ? 'sand' : 'teal')}`}>
                      {statsCopy.scaleUsage.usageCount(item.count)}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(135deg,#6a9ba0,#517d84)]"
                      style={{
                        width: `${scaleUsageMax > 0 ? Math.max(10, Math.round((item.count / scaleUsageMax) * 100)) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>占当前排行样本约 {percent}%</span>
                    <span>{item.count} 次完成</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-2">
              <StatsEmpty title={statsCopy.scaleUsage.emptyTitle} />
            </div>
          )}
        </div>
      </SectionShell>

      <SectionShell
        icon={<Users size={20} />}
        title={statsCopy.demographics.title}
        description={statsCopy.demographics.description}
        badge="Demographics"
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className={softInsetClass}>
            <p className="text-sm font-semibold text-slate-700">{statsCopy.demographics.ageTitle}</p>
            <div className="mt-4 space-y-3">
              {ageGroups.length ? (
                ageGroups.map((item) => (
                  <PercentBar key={item.label} label={item.label} value={item.value} maxValue={ageMax} />
                ))
              ) : (
                <p className="text-xs text-slate-400">{statsCopy.demographics.noData}</p>
              )}
            </div>
          </div>

          <div className={softInsetClass}>
            <p className="text-sm font-semibold text-slate-700">{statsCopy.demographics.genderTitle}</p>
            <div className="mt-4 space-y-3">
              {genders.length ? (
                genders.map((item) => (
                  <PercentBar key={item.label} label={item.label} value={item.value} maxValue={genderMax} accent="blue" />
                ))
              ) : (
                <p className="text-xs text-slate-400">{statsCopy.demographics.noData}</p>
              )}
            </div>
          </div>

          <div className={softInsetClass}>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#517d84]" />
              <p className="text-sm font-semibold text-slate-700">{statsCopy.demographics.regionTitle}</p>
            </div>
            <div className="mt-4 space-y-3">
              {regions.length ? (
                regions.map((item) => (
                  <PercentBar key={item.label} label={item.label} value={item.value} maxValue={regionMax} accent="sand" />
                ))
              ) : (
                <p className="text-xs text-slate-400">{statsCopy.demographics.noData}</p>
              )}
            </div>
          </div>

          <div className={softInsetClass}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#517d84]" />
              <p className="text-sm font-semibold text-slate-700">{statsCopy.demographics.participantsTitle}</p>
            </div>
            {participants.length ? (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {participants.map((item) => (
                  <div
                    key={`${item.name}-${item.region}`}
                    className="mist-bubble-pill rounded-full px-3 py-1.5 text-xs text-slate-600"
                  >
                    {item.name}
                    {statsCopy.demographics.participantSeparator}
                    {item.region}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400">{statsCopy.demographics.noData}</p>
            )}
          </div>
        </div>
      </SectionShell>

      <SectionShell
        icon={<Cloud size={20} />}
        title={statsCopy.wordCloud.title}
        description={statsCopy.wordCloud.description}
        badge="Word Cloud"
      >
        <div className={softInsetClass}>
          {words.length ? (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getBadgeTone('teal')}`}>
                  词条数量 {words.length}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getBadgeTone('blue')}`}>
                  最高权重 {topWord?.text || statsCopy.hero.noData}
                </span>
              </div>
              <div className="mist-bubble-card rounded-[1.75rem] px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  {words.map((item, index) => {
                    const ratio = maxWordWeight > 0 ? item.weight / maxWordWeight : 0;
                    const fontSize = 13 + Math.round(ratio * 18);
                    const opacity = 0.56 + ratio * 0.44;

                    return (
                      <span
                        key={item.text}
                        className="rounded-full px-3 py-1.5 font-medium text-[#517d84] shadow-[0_8px_20px_rgba(86,126,134,0.06)]"
                        style={{
                          fontSize: `${fontSize}px`,
                          opacity,
                          backgroundColor: getWordBackground(index),
                        }}
                      >
                        {item.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <StatsEmpty title={statsCopy.wordCloud.emptyTitle} />
          )}
        </div>
      </SectionShell>
    </div>
  );
}
