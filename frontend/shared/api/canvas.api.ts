import api from './httpClient';

export const analyzeCanvas = async (payload: {
  image_data?: string;
  reflection_text?: string;
  drawing_meta?: Record<string, any>;
}) => {
  const response = await api.post('/canvas/analyze', payload);
  return response.data;
};
