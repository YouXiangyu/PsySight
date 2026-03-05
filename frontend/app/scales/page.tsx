'use client';

import { getScaleList, recommendScales } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface ScaleItem {
  id: number;
  code: string;
  title: string;
  category: string;
  description: string;
  estimated_minutes: number;
  question_count: number;
}

export default function ScalesPage() {
  const [categories, setCategories] = useState<Array<{ name: string; items: ScaleItem[] }>>([]);
  const [query, setQuery] = useState('');
  const [recoInput, setRecoInput] = useState('');
  const [recommended, setRecommended] = useState<ScaleItem[]>([]);
  const [loadingReco, setLoadingReco] = useState(false);

  useEffect(() => {
    getScaleList(true)
      .then((res) => setCategories((res.categories || []) as Array<{ name: string; items: ScaleItem[] }>))
      .catch(() => setCategories([]));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const lower = query.trim().toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.title.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, query]);

  const handleRecommend = async () => {
    if (!recoInput.trim()) return;
    setLoadingReco(true);
    try {
      const res = await recommendScales(recoInput);
      setRecommended(res.recommended as ScaleItem[]);
    } catch {
      setRecommended([]);
    } finally {
      setLoadingReco(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">专业量表库</h1>
            <p className="text-sm text-slate-500 mt-1">支持分类浏览、预计时长预估与 AI 推荐。</p>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">
            返回首页
          </Link>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-700">不知道先做什么？让 AI 帮你选</p>
          <div className="mt-2 flex gap-2">
            <input
              value={recoInput}
              onChange={(e) => setRecoInput(e.target.value)}
              placeholder="例如：最近总是睡不着，白天没精神"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleRecommend}
              disabled={loadingReco || !recoInput.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingReco ? '推荐中...' : '推荐量表'}
            </button>
          </div>
          {recommended.length > 0 && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              {recommended.map((item) => (
                <Link
                  key={`reco-${item.id}`}
                  href={`/scale/${item.id}`}
                  className="rounded-lg border border-indigo-100 bg-indigo-50 p-3"
                >
                  <p className="text-sm font-semibold text-indigo-700">{item.title}</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {item.question_count} 题 · 约 {item.estimated_minutes} 分钟
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索量表名称或代码，如 phq9"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <section className="mt-4 space-y-4">
          {filtered.map((cat) => (
            <div key={cat.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-700">{cat.name}</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {cat.items.map((item) => (
                  <Link key={item.id} href={`/scale/${item.id}`} className="rounded-lg border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.question_count} 题 · 约 {item.estimated_minutes} 分钟
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              没有匹配结果，换个关键词试试。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
