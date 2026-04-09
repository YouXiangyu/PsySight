'use client';

import { useMemo, useState } from 'react';
import { Activity, BarChart3, ChevronDown, ChevronUp, Cloud, Users } from 'lucide-react';
import type { StatsSummary } from '@/shared/api';

type TabKey = 'overview' | 'demographics' | 'wordcloud';

function PercentBar({ label, value, maxValue }: { label: string; value: number; maxValue: number }) {
  const width = maxValue > 0 ? Math.max(6, Math.round((value / maxValue) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function StatsBoard({ stats }: { stats: StatsSummary }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const cards = stats.overview?.cards || stats.cards || [];

  const ageGroups = stats.demographics?.age_groups || [];
  const genders = stats.demographics?.genders || [];
  const regions = stats.demographics?.regions || [];
  const participants = stats.demographics?.participants || [];
  const words = stats.wordcloud || [];

  const ageMax = useMemo(() => Math.max(0, ...ageGroups.map((item) => item.value)), [ageGroups]);
  const genderMax = useMemo(() => Math.max(0, ...genders.map((item) => item.value)), [genders]);
  const regionMax = useMemo(() => Math.max(0, ...regions.map((item) => item.value)), [regions]);
  const maxWordWeight = useMemo(() => Math.max(0, ...words.map((item) => item.weight)), [words]);

  const tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
    { key: 'overview', label: '概览', icon: <BarChart3 size={14} /> },
    { key: 'demographics', label: '人群画像', icon: <Users size={14} /> },
    { key: 'wordcloud', label: '词云', icon: <Cloud size={14} /> },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity size={14} />
          基于 {stats.based_on_n} 份可见测评记录的匿名统计
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? '展开统计窗格' : '收起统计窗格'}
            className={`inline-flex items-center justify-center rounded-md p-1 border transition-colors ${
              isCollapsed
                ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                : 'border-indigo-300 bg-indigo-50 text-indigo-700'
            }`}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs border transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!isCollapsed && activeTab === 'overview' && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="text-xl font-semibold text-indigo-700">{card.value}</p>
            </div>
          ))}
          {cards.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-400">暂无统计数据</div>
          )}
        </div>
      )}

      {!isCollapsed && activeTab === 'demographics' && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600">年龄分布</p>
            {ageGroups.length ? (
              ageGroups.map((item) => (
                <PercentBar key={item.label} label={item.label} value={item.value} maxValue={ageMax} />
              ))
            ) : (
              <p className="text-xs text-slate-400">暂无数据</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600">性别分布</p>
            {genders.length ? (
              genders.map((item) => (
                <PercentBar key={item.label} label={item.label} value={item.value} maxValue={genderMax} />
              ))
            ) : (
              <p className="text-xs text-slate-400">暂无数据</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600">地区分布（Top 10）</p>
            {regions.length ? (
              regions.map((item) => (
                <PercentBar key={item.label} label={item.label} value={item.value} maxValue={regionMax} />
              ))
            ) : (
              <p className="text-xs text-slate-400">暂无数据</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">近期贡献者（匿名化）</p>
            {participants.length ? (
              <div className="flex flex-wrap gap-2">
                {participants.map((item) => (
                  <span
                    key={`${item.name}-${item.region}`}
                    className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {item.name} · {item.region}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">暂无数据</p>
            )}
          </div>
        </div>
      )}

      {!isCollapsed && activeTab === 'wordcloud' && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 min-h-[170px]">
          {words.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {words.map((item) => {
                const ratio = maxWordWeight > 0 ? item.weight / maxWordWeight : 0;
                const fontSize = 12 + Math.round(ratio * 14);
                return (
                  <span
                    key={item.text}
                    className="rounded-full bg-white border border-indigo-100 px-2 py-1 text-indigo-700"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {item.text}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">暂无词云数据</p>
          )}
        </div>
      )}
    </section>
  );
}
