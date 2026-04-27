import api from './httpClient';

export interface EmotionAnalysisResponse {
  ok: boolean;
  face_found: boolean;
  bbox?: { x: number; y: number; w: number; h: number };
  dominant_emotion?: string;
  dominant_score?: number;
  emotions: Record<string, number>;
  latency_ms?: number;
}

export const analyzeEmotionFrame = async (
  payload: {
    image_base64: string;
    mime_type: 'image/jpeg';
    capture_width: number;
    capture_height: number;
  },
  signal?: AbortSignal
) => {
  const response = await api.post<EmotionAnalysisResponse>('/vision/emotion/analyze', payload, { signal });
  return response.data;
};
