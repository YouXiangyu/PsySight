import api from './httpClient';

export const getHotlines = async () => {
  const response = await api.get('/safety/hotlines');
  return response.data as { hotlines: Array<{ name: string; phone: string }> };
};
