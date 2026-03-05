import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error?.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

export interface MessageItem {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  recommended_scale?: {
    id?: number;
    code?: string;
    title?: string;
  } | null;
}

export interface ChatPayload {
  message: string;
  session_id?: number | null;
  anonymous?: boolean;
}

export const chatWithAI = async (payload: ChatPayload) => {
  const response = await api.post('/chat', payload);
  return response.data as {
    reply: string;
    session_id: number | null;
    assistant_message_id?: number | null;
    recommended_scale?: { id: number; code: string; title: string } | null;
    crisis_alert?: {
      show: boolean;
      persistent: boolean;
      keywords: string[];
      hotlines: Array<{ name: string; phone: string }>;
      message: string;
    };
  };
};

export const register = async (payload: { email: string; password: string; username?: string }) => {
  const response = await api.post('/auth/register', payload);
  return response.data as AuthUser;
};

export const login = async (payload: { email: string; password: string }) => {
  const response = await api.post('/auth/login', payload);
  return response.data as AuthUser;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data as { authenticated: boolean; user: AuthUser | null };
};

export const listConversations = async () => {
  const response = await api.get('/conversations');
  return response.data as {
    items: Array<{ id: number; title: string; created_at: string; updated_at: string }>;
  };
};

export const createConversation = async (title?: string) => {
  const response = await api.post('/conversations', { title });
  return response.data as { id: number; title: string };
};

export const getConversationMessages = async (sessionId: number) => {
  const response = await api.get(`/conversations/${sessionId}/messages`);
  return response.data as { items: MessageItem[]; session_id: number; title: string };
};

export const sendMessageFeedback = async (messageId: number, feedback: 'up' | 'down') => {
  const response = await api.post(`/messages/${messageId}/feedback`, { feedback });
  return response.data;
};

export const getScaleDetail = async (id: number) => {
  const response = await api.get(`/scales/${id}`);
  return response.data;
};

export const getScaleDetailByCode = async (code: string) => {
  const response = await api.get(`/scales/code/${code}`);
  return response.data;
};

export const getScaleList = async (grouped = false) => {
  const response = await api.get(`/scales${grouped ? '?grouped=1' : ''}`);
  return response.data as {
    items?: Array<any>;
    categories?: Array<{ name: string; items: Array<any> }>;
    total?: number;
  };
};

export const recommendScales = async (text: string) => {
  const response = await api.post('/scales/recommend', { text });
  return response.data as { recommended: Array<any> };
};

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
  return response.data;
};

export const analyzeCanvas = async (payload: {
  image_data?: string;
  reflection_text?: string;
  drawing_meta?: Record<string, any>;
}) => {
  const response = await api.post('/canvas/analyze', payload);
  return response.data;
};

export const getHotlines = async () => {
  const response = await api.get('/safety/hotlines');
  return response.data as { hotlines: Array<{ name: string; phone: string }> };
};

export const getStatsSummary = async () => {
  const response = await api.get('/stats/summary');
  return response.data as {
    based_on_n: number;
    cards: Array<{ label: string; value: string }>;
  };
};

export const exportResearchData = async (format: 'json' | 'csv', adminToken: string) => {
  const response = await api.get(`/admin/export?format=${format}`, {
    headers: {
      'X-Admin-Token': adminToken,
    },
    responseType: format === 'csv' ? 'blob' : 'json',
  });
  return response.data;
};

export default api;
