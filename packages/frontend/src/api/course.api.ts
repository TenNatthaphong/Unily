import api from './axios';
import type { Course, PaginatedResponse } from '../types';

export const courseApi = {
  search: (params: { search?: string; facultyId?: string; deptId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Course>>('/courses', { params }),

  getById: (id: string) =>
    api.get<Course>(`/courses/${id}`),

  // Admin
  create: (data: Partial<Course>) =>
    api.post<Course>('/admin/courses', data),

  update: (id: string, data: Partial<Course>) =>
    api.patch<Course>(`/admin/courses/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/courses/${id}`),
};
