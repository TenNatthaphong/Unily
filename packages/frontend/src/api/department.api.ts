import api from './axios';
import type { Department } from '../types';

export const departmentApi = {
  getByFaculty: (facultyId: string) =>
    api.get<Department[]>(`/department/faculty/${facultyId}`),

  // Admin
  create: (data: Partial<Department>) =>
    api.post<Department>('/admin/department', data),

  update: (id: string, data: Partial<Department>) =>
    api.patch<Department>(`/admin/department/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/department/${id}`),
};
