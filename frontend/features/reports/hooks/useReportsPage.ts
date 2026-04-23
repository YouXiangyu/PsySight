import { useCallback, useEffect, useState } from 'react';
import { getMe, getMyReports, setReportStatsVisibility } from '@/lib/api';
import { reportsCopy } from '@/shared/copy/app-copy';
import { getErrorMessage } from '@/shared/ui/request-state';

export type ReportItem = Awaited<ReturnType<typeof getMyReports>>['items'][number];

export function useReportsPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReports = useCallback(async () => {
    const data = await getMyReports({ limit: 100 });
    setItems(data.items);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const me = await getMe();
      setAuthenticated(me.authenticated);

      if (!me.authenticated) {
        return;
      }

      await loadReports();
    } catch (error) {
      setErrorMsg(getErrorMessage(error, reportsCopy.fallbackErrors.load));
    } finally {
      setLoading(false);
    }
  }, [loadReports]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleToggleVisibility = async (item: ReportItem) => {
    setUpdatingId(item.id);
    setErrorMsg('');

    try {
      await setReportStatsVisibility(item.id, !item.hidden_from_stats);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, hidden_from_stats: !row.hidden_from_stats } : row))
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error, reportsCopy.fallbackErrors.visibility));
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
    reload,
  };
}
