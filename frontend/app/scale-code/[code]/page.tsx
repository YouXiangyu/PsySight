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
          setError('推荐量表解析失败，正在跳转回量表库...');
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
    <div className="mist-page px-4 py-8 md:py-12">
      <div className="mist-container mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/75 bg-white/85 p-6 shadow-[0_20px_60px_rgba(86,126,134,0.12)] backdrop-blur">
        <div className="flex items-center gap-3 text-[#517d84]">
          <Loader2 className="animate-spin" size={20} />
          <p className="text-sm font-medium">正在解析推荐量表...</p>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
