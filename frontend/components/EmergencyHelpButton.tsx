'use client';

import { getHotlines } from '@/lib/api';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EmergencyHelpButton() {
  const [open, setOpen] = useState(false);
  const [hotlines, setHotlines] = useState<Array<{ name: string; phone: string }>>([]);

  useEffect(() => {
    getHotlines()
      .then((res) => setHotlines(res.hotlines || []))
      .catch(() =>
        setHotlines([
          { name: '全国心理援助热线', phone: '400-161-9995' },
          { name: '生命热线', phone: '400-821-1215' },
        ])
      );
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.85rem)] right-3 z-40 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-3 text-xs font-semibold text-white shadow-[0_18px_36px_rgba(225,29,72,0.28)] transition hover:bg-rose-700 sm:bottom-4 sm:right-4 sm:text-sm"
      >
        <AlertTriangle size={15} />
        <span className="whitespace-nowrap">紧急求助</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100svh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-rose-100 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl sm:max-h-[85svh] sm:p-5 sm:pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-rose-700">
                <AlertTriangle size={18} />
                紧急支持入口
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-700">
              你不需要独自承受。若你现在正处于危险或极度痛苦状态，请优先联系专业热线或当地紧急服务。
            </p>

            <div className="mt-3 space-y-2.5">
              {hotlines.map((item) => (
                <a
                  key={item.phone}
                  href={`tel:${item.phone}`}
                  className="block rounded-[1.15rem] border border-slate-200 p-3 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700">
                      <Phone size={14} />
                      {item.phone}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
