'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { getScaleDetailByCode } from '@/lib/api';

export default function ScaleCodePage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState('');

  const code = useMemo(() => {
    const value = params?.code;
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value[0]?.trim() || '';
    return '';
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    const resolveScale = async () => {
      if (!code) {
        router.replace('/scales');
        return;
      }

      try {
        const scale = await getScaleDetailByCode(code);
        const scaleId = Number(scale?.id);
        if (Number.isFinite(scaleId) && scaleId > 0) {
          router.replace(`/scale/${scaleId}`);
          return;
        }
      } catch {
        if (!cancelled) {
          setError('Failed to resolve recommended scale. Redirecting to scale library...');
        }
      }

      if (!cancelled) {
        window.setTimeout(() => {
          router.replace('/scales');
        }, 700);
      }
    };

    resolveScale();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-indigo-700">
          <Loader2 className="animate-spin" size={20} />
          <p className="text-sm font-medium">Resolving recommended scale...</p>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
