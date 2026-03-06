import api from './httpClient';

export const submitAssessment = async (payload: {
  scale_id?: number;
  scale_code?: string;
  answers: Record<string, number>;
  emotion_log: Record<string, number>;
  emotion_consent: boolean;
  anonymous?: boolean;
}) => {
  const response = await api.post('/submit', payload);
  return response.data;
};

export const getReport = async (id: number) => {
  const response = await api.get(`/report/${id}`);
  return response.data as {
    id: number;
    scale: {
      id: number;
      code: string;
      title: string;
      category: string;
      description: string;
      estimated_minutes: number;
      question_count: number;
    } | null;
    total_score: number;
    severity_level: string;
    score_explanation: string;
    urgent_recommendation?: string | null;
    ai_report: string;
    emotion_log: Record<string, number>;
    emotion_consent: boolean;
    anonymous: boolean;
    owner: { id: number; username: string; public_name: string } | null;
    hidden_from_stats: boolean;
    created_at: string;
  };
};

export const getMyReports = async (params?: { limit?: number; offset?: number }) => {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const response = await api.get(`/reports/me${query.toString() ? `?${query}` : ''}`);
  return response.data as {
    items: Array<{
      id: number;
      scale: {
        id: number;
        code: string;
        title: string;
        category: string;
        description: string;
        estimated_minutes: number;
        question_count: number;
      };
      total_score: number;
      severity_level: string;
      score_explanation: string;
      created_at: string;
      hidden_from_stats: boolean;
    }>;
    count: number;
  };
};

export const setReportStatsVisibility = async (id: number, hidden_from_stats: boolean) => {
  const response = await api.patch(`/reports/${id}/stats-visibility`, { hidden_from_stats });
  return response.data as {
    ok: boolean;
    record_id: number;
    hidden_from_stats: boolean;
  };
};
