import api from './axios';
import type { AuthTokens } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),
};
