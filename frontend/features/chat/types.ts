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
    fit_score?: number | null;
    question_count?: number | null;
    assessment_depth?: string | null;
    question_style?: string | null;
    clinical_focus?: string | null;
    reason?: string | null;
  }>;
  feedback?: 'up' | 'down';
  isError?: boolean;
  model_used?: string;
  intent_detected?: string;
  conversation_goal?: string;
  follow_up_question?: string;
}

export interface CrisisAlert {
  show: boolean;
  keywords: string[];
  hotlines: Array<{ name: string; phone: string }>;
  message: string;
  persistent: boolean;
}
