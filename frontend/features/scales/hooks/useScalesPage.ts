import { useEffect, useMemo, useState } from 'react';
import { getScaleList, recommendScales } from '@/lib/api';

export interface ScaleItem {
  id: number;
  code: string;
  title: string;
  category: string;
  description: string;
  estimated_minutes: number;
  question_count: number;
}

export function useScalesPage() {
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

  return {
    query,
    recoInput,
    recommended,
    loadingReco,
    filtered,
    setQuery,
    setRecoInput,
    handleRecommend,
  };
}
