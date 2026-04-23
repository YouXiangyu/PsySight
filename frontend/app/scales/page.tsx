'use client';

import AppHeader from '@/components/AppHeader';
import LoadingButton from '@/components/LoadingButton';
import StatePanel from '@/components/StatePanel';
import { useScalesPage, type ScaleItem } from '@/features/scales/hooks/useScalesPage';
import { commonCopy, scalesCopy } from '@/shared/copy/app-copy';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  ClipboardList,
  Clock3,
  Layers3,
  RefreshCcw,
  Search,
  Sparkles,
} from 'lucide-react';

const highlightTags = ['AI 智能推荐', '预计时长清晰', '按主题快速筛选'];

function ScaleCardSkeleton() {
  return (
    <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-4 shadow-[0_18px_34px_rgba(86,126,134,0.08)] sm:rounded-[1.6rem] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-6 w-20 rounded-full bg-slate-100" />
        <div className="h-5 w-10 rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-100" />
      <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
      <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-24 rounded-full bg-slate-100" />
        <div className="h-8 w-28 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function StatsPill({
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

function getCategoryStyle(name: string) {
  const value = name.toLowerCase();

  if (value.includes('睡眠')) {
    return {
      chip: 'bg-[#e6f3f0] text-[#356b73]',
      soft: 'bg-[#f3faf8] border-[#d7ebe6]',
    };
  }

  if (value.includes('焦虑') || value.includes('抑郁') || value.includes('情绪')) {
    return {
      chip: 'bg-[#eaf1f7] text-[#496b89]',
      soft: 'bg-[#f5f8fc] border-[#dae6f1]',
    };
  }

  if (value.includes('人格') || value.includes('关系')) {
    return {
      chip: 'bg-[#f4efe6] text-[#806347]',
      soft: 'bg-[#fcfaf6] border-[#ece2cf]',
    };
  }

  return {
    chip: 'bg-[#edf4f4] text-[#4a787c]',
    soft: 'bg-[#f7fbfb] border-[#dbe9e9]',
  };
}

function MetaChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d8e8e5] bg-[#f7fbfb] px-3 py-1.5 text-xs text-slate-600">
      {icon}
      {label}
    </div>
  );
}

function ScaleCard({ item, categoryName }: { item: ScaleItem; categoryName: string }) {
  const style = getCategoryStyle(categoryName);

  return (
    <Link
      href={`/scale/${item.id}`}
      className={`group rounded-[1.4rem] border bg-white/90 p-4 shadow-[0_18px_34px_rgba(86,126,134,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-white sm:rounded-[1.6rem] sm:p-5 ${style.soft}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${style.chip}`}>{categoryName}</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-400 shadow-sm">{item.code}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-7 text-slate-800">{item.title}</h3>
          <ArrowUpRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:text-[#4f8085]" />
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <MetaChip icon={<ClipboardList size={14} className="text-[#5c8b90]" />} label={`${item.question_count} 题`} />
        <MetaChip icon={<Clock3 size={14} className="text-[#5c8b90]" />} label={`约 ${item.estimated_minutes} 分钟`} />
      </div>

      <div className="mt-5 flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-slate-400">结构化自评量表</span>
        <span className="font-medium text-[#4a7c81]">开始测评</span>
      </div>
    </Link>
  );
}

export default function ScalesPage() {
  const {
    query,
    recoInput,
    recommended,
    listLoading,
    listError,
    loadingReco,
    recoError,
    hasTriedRecommend,
    filtered,
    setQuery,
    setRecoInput,
    handleRecommend,
    reloadScales,
  } = useScalesPage();

  const visibleScaleCount = filtered.reduce((sum, category) => sum + category.items.length, 0);
  const visibleCategoryCount = filtered.length;

  return (
    <div className="mist-page min-h-screen">
      <div className="mist-container min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
          <section className="mist-panel relative overflow-hidden rounded-[1.8rem] px-4 py-5 sm:rounded-[2.2rem] sm:px-6 sm:py-6 md:px-7 md:py-7">
            <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(166,210,205,0.45),transparent_70%)]" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(188,210,226,0.45),transparent_72%)]" />
            <div className="relative grid gap-4 sm:gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                  <BookOpen size={14} />
                  结构化心理量表入口
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h1 className="text-[2rem] font-semibold tracking-tight text-slate-800 md:text-[2.4rem]">
                    {scalesCopy.title}
                  </h1>
                  <Link href="/chat" className="mist-link text-sm">
                    {commonCopy.actions.backToChat}
                  </Link>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-[15px]">
                  {scalesCopy.description}
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
                <StatsPill label="当前可见量表" value={`${visibleScaleCount}`} icon={<ClipboardList size={18} />} />
                <StatsPill label="主题分区" value={`${visibleCategoryCount}`} icon={<Layers3 size={18} />} />
                <StatsPill label="推荐结果" value={`${recommended.length}`} icon={<Sparkles size={18} />} />
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="mist-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                    <Sparkles size={14} />
                    AI 推荐
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-800">{scalesCopy.recommendTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    输入你最近的困扰或状态描述，系统会优先推荐更接近当前需求的量表。
                  </p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f1ef] text-[#4a7a80] md:flex">
                  <Brain size={22} />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <input
                  value={recoInput}
                  onChange={(event) => setRecoInput(event.target.value)}
                  placeholder={scalesCopy.recommendPlaceholder}
                  className="flex-1 rounded-[1.2rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea] sm:rounded-2xl"
                />
                <LoadingButton
                  type="button"
                  onClick={handleRecommend}
                  disabled={!recoInput.trim()}
                  loading={loadingReco}
                  loadingText={scalesCopy.actions.recommending}
                  className="mist-primary-button flex items-center justify-center gap-2 rounded-[1.2rem] px-5 py-3 text-sm font-medium sm:rounded-2xl"
                >
                  {scalesCopy.actions.recommend}
                </LoadingButton>
              </div>

              {recoError ? (
                <div className="mt-4">
                  <StatePanel title={scalesCopy.recommendationErrorTitle} description={recoError} tone="danger" />
                </div>
              ) : recommended.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {recommended.map((item) => (
                    <Link
                      key={`reco-${item.id}`}
                      href={`/scale/${item.id}`}
                      className="group rounded-[1.4rem] border border-[#d9ebe7] bg-[#f3f9f8] p-4 transition hover:border-[#b6d6d2] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#4f7d83] shadow-sm">推荐</span>
                        <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-[#4f8085]" />
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item.title}</p>
                      <p className="mt-3 text-xs text-[#5f8e94]">
                        {item.question_count} 题，约 {item.estimated_minutes} 分钟
                      </p>
                    </Link>
                  ))}
                </div>
              ) : hasTriedRecommend && !loadingReco ? (
                <div className="mt-4">
                  <StatePanel
                    icon={<Sparkles size={18} />}
                    title={scalesCopy.recommendationEmptyTitle}
                    description={scalesCopy.recommendationEmptyDescription}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-[#d6e8e5] bg-[#f8fbfb] px-4 py-4 text-sm leading-6 text-slate-500">
                  还没有开始推荐时，你可以直接在下方浏览全部量表，或先输入一段最近的状态描述。
                </div>
              )}
            </div>

            <div className="mist-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4f7] px-3 py-1 text-xs font-medium text-[#597590]">
                <Search size={14} />
                快速筛选
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-800">按量表名称、代码或主题查找</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                适合已经知道自己想了解的主题，或希望快速定位某份量表。
              </p>

              <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/90 p-3 sm:rounded-[1.6rem]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6f5] text-[#4a7a80]">
                    <Search size={18} />
                  </div>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={scalesCopy.searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#f4faf9] px-4 py-4">
                  <p className="text-xs text-slate-400">筛选后结果</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{visibleScaleCount}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f7f9fc] px-4 py-4">
                  <p className="text-xs text-slate-400">覆盖主题</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{visibleCategoryCount}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-[#dbe8ec] bg-white/88 px-4 py-4 text-sm leading-6 text-slate-500">
                {query.trim()
                  ? `当前正在按“${query.trim()}”筛选，下面会只显示匹配的量表。`
                  : '还没有输入关键词时，将默认展示全部可用量表。'}
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6f5] px-3 py-1 text-xs font-medium text-[#4a7a80]">
                  <Layers3 size={14} />
                  量表清单
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-800">按主题浏览并开始测评</h2>
                <p className="mt-1 text-sm text-slate-500">
                  每张卡片都提供题量、预计时长和主题归类，方便快速判断是否适合当前状态。
                </p>
              </div>
              <div className="w-full rounded-[1.15rem] border border-white/75 bg-white/88 px-4 py-2.5 text-sm text-slate-500 shadow-[0_12px_24px_rgba(86,126,134,0.06)] sm:w-auto sm:rounded-full sm:py-2">
                共 <span className="font-semibold text-slate-800">{visibleScaleCount}</span> 份量表，
                分布在 <span className="font-semibold text-slate-800">{visibleCategoryCount}</span> 个主题中
              </div>
            </div>

            <div className="space-y-4">
              {listLoading ? (
                <div className="mist-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Sparkles size={16} className="text-[#4a7a80]" />
                    {scalesCopy.listLoadingTitle}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((item) => (
                      <ScaleCardSkeleton key={item} />
                    ))}
                  </div>
                </div>
              ) : listError ? (
                <StatePanel
                  icon={<RefreshCcw size={18} />}
                  title={scalesCopy.listErrorTitle}
                  description={listError}
                  tone="danger"
                  actions={
                    <button
                      type="button"
                      onClick={() => void reloadScales()}
                      className="mist-primary-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                    >
                      <RefreshCcw size={14} />
                      {commonCopy.actions.reload}
                    </button>
                  }
                />
              ) : filtered.length === 0 ? (
                <StatePanel
                  icon={<Search size={18} />}
                  title={scalesCopy.noSearchResultTitle}
                  description={scalesCopy.noSearchResultDescription}
                />
              ) : (
                filtered.map((category) => (
                  <section key={category.name} className="mist-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f1f1] text-[#4a7a80]">
                          <Layers3 size={18} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{category.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">当前主题下共有 {category.items.length} 份量表可选。</p>
                        </div>
                      </div>
                      <span className="w-full rounded-[1.1rem] bg-white px-3 py-1.5 text-center text-xs font-medium text-slate-500 shadow-sm sm:w-auto sm:rounded-full">
                        分类浏览
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {category.items.map((item) => (
                        <ScaleCard key={item.id} item={item} categoryName={category.name} />
                      ))}
                    </div>
                  </section>
                ))
              )}

              {!listLoading && !listError && !filtered.length && !query.trim() ? (
                <StatePanel
                  icon={<ClipboardList size={18} />}
                  title={scalesCopy.emptyLibraryTitle}
                  description={scalesCopy.emptyLibraryDescription}
                />
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
