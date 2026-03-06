import { useEffect, useState } from 'react';
import { getMe, getMyReports, setReportStatsVisibility } from '@/lib/api';

export type ReportItem = Awaited<ReturnType<typeof getMyReports>>['items'][number];

export function useReportsPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReports = async () => {
    const data = await getMyReports({ limit: 100 });
    setItems(data.items);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const me = await getMe();
        setAuthenticated(me.authenticated);
        if (!me.authenticated) return;
        await loadReports();
      } catch (error) {
        setErrorMsg((error as Error).message || '加载报告失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggleVisibility = async (item: ReportItem) => {
    setUpdatingId(item.id);
    setErrorMsg('');
    try {
      await setReportStatsVisibility(item.id, !item.hidden_from_stats);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, hidden_from_stats: !row.hidden_from_stats } : row))
      );
    } catch (error) {
      setErrorMsg((error as Error).message || '更新统计可见性失败');
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    loading,
    authenticated,
    items,
    updatingId,
    errorMsg,
    handleToggleVisibility,
  };
}
