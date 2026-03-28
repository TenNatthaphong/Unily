import api from './axios';
import type { Department } from '../types';

export const departmentApi = {
  /** Get departments by facultyId (UUID) */
  getByFaculty: (facultyId: string) =>
    api.get<Department[]>(`/department/by-faculty/${facultyId}`),

  // Admin CRUD — match updated routes (PATCH/DELETE by :id)
  create: (data: Partial<Department>) =>
    api.post<Department>('/admin/department', data),

  update: (id: string, data: Partial<Department>) =>
    api.patch<Department>(`/admin/department/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/department/${id}`),

  importCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/admin/department/import', fd);
  },
};
