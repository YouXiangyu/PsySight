export type NoticeTone = 'success' | 'danger';

export interface NoticeState {
  tone: NoticeTone;
  title: string;
  description: string;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
