export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  recommended_scale?: {
    id: number;
    code?: string;
    title: string;
  };
  feedback?: 'up' | 'down';
  isError?: boolean;
}

export interface CrisisAlert {
  show: boolean;
  keywords: string[];
  hotlines: Array<{ name: string; phone: string }>;
  message: string;
  persistent: boolean;
}
