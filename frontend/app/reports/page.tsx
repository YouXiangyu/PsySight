'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ReportsGrid from '@/features/reports/components/ReportsGrid';
import { useReportsPage } from '@/features/reports/hooks/useReportsPage';

export default function ReportsPage() {
  const { loading, authenticated, items, updatingId, errorMsg, handleToggleVisibility } = useReportsPage();

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
          <ReportsGrid items={items} updatingId={updatingId} onToggleVisibility={handleToggleVisibility} />
        )}
      </main>
    </div>
  );
}
