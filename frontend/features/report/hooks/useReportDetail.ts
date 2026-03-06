import { useEffect, useMemo, useState } from 'react';
import type { StatsSummary } from '@/shared/api';
import { getReport, getStatsSummary } from '@/lib/api';

export function useReportDetail(reportId: number) {
  const [record, setRecord] = useState<any>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await getReport(reportId);
        setRecord(response);
        const summary = await getStatsSummary();
        setStats(summary);
      } catch (e) {
        setErrorMsg((e as Error).message || '报告加载失败');
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(reportId)) {
      fetchReport();
    } else {
      setLoading(false);
      setErrorMsg('报告编号无效');
    }
  }, [reportId]);

  const subjectName = useMemo(() => {
    if (record?.anonymous) return '匿名用户';
    return record?.owner?.username || record?.owner?.public_name || '登录用户';
  }, [record]);

  return { record, stats, loading, errorMsg, subjectName };
}
