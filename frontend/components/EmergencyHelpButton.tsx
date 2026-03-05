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
        className="fixed z-40 bottom-4 right-4 rounded-full bg-rose-600 text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-rose-700"
      >
        紧急求助
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-rose-100 shadow-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-semibold">
                <AlertTriangle size={18} />
                紧急支持入口
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              你不需要独自承受。若你现在处于危险或极度痛苦状态，请优先联系专业热线。
            </p>
            <div className="mt-3 space-y-2">
              {hotlines.map((item) => (
                <a
                  key={item.phone}
                  href={`tel:${item.phone}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-sm">
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
