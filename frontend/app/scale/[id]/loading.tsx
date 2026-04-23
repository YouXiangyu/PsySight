'use client';

import { Loader2 } from 'lucide-react';

export default function ScaleRouteLoading() {
  return (
    <div className="mist-page px-4 py-8 md:py-12">
      <div className="mist-container mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/75 bg-white/85 p-6 shadow-[0_20px_60px_rgba(86,126,134,0.12)] backdrop-blur">
        <div className="flex items-center gap-3 text-[#517d84]">
          <Loader2 className="animate-spin" size={20} />
          <p className="text-sm font-medium">正在进入测评页面...</p>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-100" />
          <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-100" />
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
