export interface AuthUser {
  id: number;
  email: string;
  username: string;
  gender?: string | null;
  age?: number | null;
  region?: string | null;
  show_nickname_in_stats?: boolean;
  public_name?: string;
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

export interface StatsSummary {
  based_on_n: number;
  cards: Array<{ label: string; value: string }>;
  overview?: {
    cards: Array<{ label: string; value: string }>;
  };
  demographics?: {
    age_groups?: Array<{ label: string; value: number }>;
    genders?: Array<{ label: string; value: number }>;
    regions?: Array<{ label: string; value: number }>;
    participants?: Array<{ name: string; region: string; reports: number }>;
  };
  wordcloud?: Array<{ text: string; weight: number }>;
  scale_usage?: Array<{
    code?: string;
    title: string;
    category?: string | null;
    count: number;
  }>;
}
