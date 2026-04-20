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
      setLoading(true);
      setErrorMsg('');

      try {
        const report = await getReport(reportId);
        setRecord(report);
      } catch (e) {
        setRecord(null);
        setStats(null);
        setErrorMsg((e as Error).message || '报告加载失败');
        setLoading(false);
        return;
      }

      try {
        const summary = await getStatsSummary();
        setStats(summary);
      } catch {
        setStats(null);
      }

      setLoading(false);
    };

    if (!Number.isNaN(reportId)) {
      fetchReport();
    } else {
      setRecord(null);
      setStats(null);
      setLoading(false);
      setErrorMsg('报告编号无效');
    }
  }, [reportId]);

  const subjectName = useMemo(() => {
    if (record?.anonymous) return '匿名用户';
    return record?.owner?.public_name || record?.owner?.username || '登录用户';
  }, [record]);

  return { record, stats, loading, errorMsg, subjectName };
}
