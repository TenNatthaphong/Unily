import api from './axios';
import type { Faculty } from '../types';

export const facultyApi = {
  getAll: () =>
    api.get<Faculty[]>('/faculty'),

  // Admin
  create: (data: Partial<Faculty>) =>
    api.post<Faculty>('/admin/faculty', data),

  update: (id: string, data: Partial<Faculty>) =>
    api.patch<Faculty>(`/admin/faculty/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/faculty/${id}`),
};
