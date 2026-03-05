'use client';

import ChatWindow from '@/components/ChatWindow';
import Link from 'next/link';
import { getStatsSummary } from '@/lib/api';
import { Activity, PenTool, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [stats, setStats] = useState<{ based_on_n: number; cards: Array<{ label: string; value: string }> } | null>(
    null
  );

  useEffect(() => {
    getStatsSummary()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="h-screen bg-[#eef2f7] flex flex-col">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              P
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">PsySight</h1>
              <p className="text-xs text-slate-400">大学生智能心理支持系统</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/scales" className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-600 flex items-center gap-1">
              <Scale size={14} />
              量表库
            </Link>
            <Link href="/canvas" className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-600 flex items-center gap-1">
              <PenTool size={14} />
              绘画投射
            </Link>
            <Link href="/auth" className="rounded-md px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700">
              登录 / 注册
            </Link>
          </nav>
        </div>
      </header>

      {stats && (
        <section className="px-4 pt-3">
          <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Activity size={14} />
              基于 {stats.based_on_n} 位用户的匿名统计
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {stats.cards.map((card) => (
                <div key={card.label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="text-xl font-semibold text-indigo-700">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 min-h-0 px-4 pb-4 pt-3">
        <div className="mx-auto max-w-6xl h-full rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}
