import api from './httpClient';
import type { ChatPayload, MessageItem } from './types';

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
