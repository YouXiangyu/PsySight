import { useEffect, useMemo, useState } from 'react';
import type { StatsSummary } from '@/shared/api';
import { getReport, getStatsSummary } from '@/lib/api';
import { reportDetailCopy } from '@/shared/copy/report-detail-copy';
import { getErrorMessage } from '@/shared/ui/request-state';

type ReportRecord = Awaited<ReturnType<typeof getReport>>;

export function useReportDetail(reportId: number) {
  const [record, setRecord] = useState<ReportRecord | null>(null);
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
      } catch (error) {
        setRecord(null);
        setStats(null);
        setErrorMsg(getErrorMessage(error, reportDetailCopy.fallbackErrors.load));
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
      void fetchReport();
    } else {
      setRecord(null);
      setStats(null);
      setLoading(false);
      setErrorMsg(reportDetailCopy.fallbackErrors.invalidId);
    }
  }, [reportId]);

  const subjectName = useMemo(() => {
    if (record?.anonymous) {
      return reportDetailCopy.meta.anonymousUser;
    }

    return record?.owner?.public_name || record?.owner?.username || reportDetailCopy.meta.signedInUser;
  }, [record]);

  return { record, stats, loading, errorMsg, subjectName };
}
