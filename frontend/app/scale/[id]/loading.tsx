'use client';

import { Loader2 } from 'lucide-react';

export default function ScaleRouteLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-indigo-700">
          <Loader2 className="animate-spin" size={20} />
          <p className="text-sm font-medium">正在进入测评页...</p>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
