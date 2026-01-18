import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatWithAI = async (message: string) => {
  const response = await api.post('/chat', { message });
  return response.data;
};

export const getScaleDetail = async (id: number) => {
  const response = await api.get(`/scales/${id}`);
  return response.data;
};

export const submitAssessment = async (payload: {
  user_id: number;
  scale_id: number;
  answers: Record<string, number>;
  emotion_log: Record<string, number>;
}) => {
  const response = await api.post('/submit', payload);
  return response.data;
};

export const analyzeCanvas = async (imageData: string) => {
  const response = await api.post('/canvas/analyze', { image_data: imageData });
  return response.data;
};

export default api;
