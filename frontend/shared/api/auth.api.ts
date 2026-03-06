import api from './httpClient';
import type { AuthUser } from './types';

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

export const updateMyProfile = async (payload: {
  gender?: string | null;
  age?: number | null;
  region?: string | null;
  show_nickname_in_stats?: boolean;
}) => {
  const response = await api.patch('/me/profile', payload);
  return response.data as { ok: boolean; user: AuthUser };
};
