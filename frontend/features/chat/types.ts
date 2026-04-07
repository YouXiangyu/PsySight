export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  recommended_scale?: {
    id: number;
    code?: string;
    title: string;
  };
  recommended_scales?: Array<{
    code: string;
    title: string;
    scale_id?: number | null;
  }>;
  feedback?: 'up' | 'down';
  isError?: boolean;
  model_used?: string;
  intent_detected?: string;
}

export interface CrisisAlert {
  show: boolean;
  keywords: string[];
  hotlines: Array<{ name: string; phone: string }>;
  message: string;
  persistent: boolean;
}
