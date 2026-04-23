import { useCallback, useEffect, useMemo, useState } from 'react';
import { getScaleList, recommendScales } from '@/lib/api';
import { scalesCopy } from '@/shared/copy/app-copy';
import { getErrorMessage } from '@/shared/ui/request-state';

export interface ScaleItem {
  id: number;
  code: string;
  title: string;
  category: string;
  description: string;
  estimated_minutes: number;
  question_count: number;
}

type ScaleCategory = {
  name: string;
  items: ScaleItem[];
};

export function useScalesPage() {
  const [categories, setCategories] = useState<ScaleCategory[]>([]);
  const [query, setQuery] = useState('');
  const [recoInput, setRecoInput] = useState('');
  const [recommended, setRecommended] = useState<ScaleItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [loadingReco, setLoadingReco] = useState(false);
  const [recoError, setRecoError] = useState('');
  const [hasTriedRecommend, setHasTriedRecommend] = useState(false);

  const loadScales = useCallback(async () => {
    setListLoading(true);
    setListError('');

    try {
      const res = await getScaleList(true);
      setCategories((res.categories || []) as ScaleCategory[]);
    } catch (error) {
      setCategories([]);
      setListError(getErrorMessage(error, scalesCopy.fallbackErrors.list));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScales();
  }, [loadScales]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return categories;
    }

    const lower = query.trim().toLowerCase();

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) => item.title.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, query]);

  const handleRecommend = async () => {
    if (!recoInput.trim()) {
      return;
    }

    setLoadingReco(true);
    setRecoError('');
    setHasTriedRecommend(true);

    try {
      const res = await recommendScales(recoInput);
      setRecommended(res.recommended as ScaleItem[]);
    } catch (error) {
      setRecommended([]);
      setRecoError(getErrorMessage(error, scalesCopy.fallbackErrors.recommend));
    } finally {
      setLoadingReco(false);
    }
  };

  return {
    query,
    recoInput,
    recommended,
    listLoading,
    listError,
    loadingReco,
    recoError,
    hasTriedRecommend,
    filtered,
    setQuery,
    setRecoInput,
    handleRecommend,
    reloadScales: loadScales,
  };
}
