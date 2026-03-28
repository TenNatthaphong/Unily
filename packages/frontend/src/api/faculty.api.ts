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

  delete: (facultyCode: string) =>
    api.delete('/admin/faculty', { params: { facultyCode } }),

  importCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/admin/faculty/import', fd);
  },
};
