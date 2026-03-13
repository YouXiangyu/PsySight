import api from './httpClient';

export const getScaleDetail = async (id: number) => {
  const response = await api.get(`/scales/${id}`);
  return response.data;
};

export const getScaleMeta = async (id: number) => {
  const response = await api.get(`/scales/${id}?include_questions=0`);
  return response.data;
};

export const getScaleDetailByCode = async (code: string) => {
  const response = await api.get(`/scales/code/${code}`);
  return response.data;
};

export const getScaleQuestionsChunk = async (id: number, offset: number, limit = 10) => {
  const response = await api.get(`/scales/${id}/questions?offset=${offset}&limit=${limit}`);
  return response.data as {
    scale_id: number;
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
    items: Array<any>;
  };
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
