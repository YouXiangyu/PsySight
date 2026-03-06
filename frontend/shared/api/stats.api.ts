import api from './httpClient';
import type { StatsSummary } from './types';

export const getStatsSummary = async () => {
  const response = await api.get('/stats/summary');
  return response.data as StatsSummary;
};
