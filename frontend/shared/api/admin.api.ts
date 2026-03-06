import api from './httpClient';

export const exportResearchData = async (format: 'json' | 'csv', adminToken: string) => {
  const response = await api.get(`/admin/export?format=${format}`, {
    headers: {
      'X-Admin-Token': adminToken,
    },
    responseType: format === 'csv' ? 'blob' : 'json',
  });
  return response.data;
};
