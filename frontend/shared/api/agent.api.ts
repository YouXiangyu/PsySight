import api from './httpClient';

export interface AgentChatPayload {
  message: string;
  session_id?: number | null;
  user_id?: number | null;
  anonymous?: boolean;
  use_thinking?: boolean;
  search_mode?: 'index' | 'rag';
}

export interface ScaleRecommendationItem {
  code: string;
  title: string;
  scale_id?: number | null;
}

export interface AgentCrisisAlert {
  show: boolean;
  keywords: string[];
  hotlines: Array<{ name: string; phone: string }>;
  message: string;
  persistent: boolean;
}

export interface AgentChatResponse {
  reply: string;
  session_id: number | null;
  assistant_message_id?: number | null;
  recommended_scales: ScaleRecommendationItem[];
  crisis_alert?: AgentCrisisAlert | null;
  model_used: string;
  search_mode_used: string;
  intent_detected: string;
}

export const agentChat = async (payload: AgentChatPayload): Promise<AgentChatResponse> => {
  const response = await api.post('/agent/chat', payload);
  return response.data;
};

export const triggerSessionSummary = async (sessionId: number) => {
  const response = await api.post(`/agent/summarize/${sessionId}`);
  return response.data;
};
