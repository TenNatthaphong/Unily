import api from './axios';
import type { Curriculum, CurriculumCourse } from '../types';

export interface CurriculumPlanResponse {
  curriculum: Curriculum;
  plan: (CurriculumCourse & { status: 'COMPLETED' | 'REMAINING' })[];
  stats: {
    totalCredits: number;
    creditsEarned: number;
    gpax: number;
  };
}

export const curriculumApi = {
  // Public / paginated list
  search: (params: { page?: number; limit?: number; search?: string; code?: string; facultyId?: string; deptId?: string }) =>
    api.get<any>('/curriculums', { params }),

  getById: (id: string) =>
    api.get<Curriculum>(`/curriculums/${id}`),

  // Student
  getMyPlan: () =>
    api.get<CurriculumPlanResponse>('/curriculums/my/plan'),

  // Admin CRUD
  create: (data: Partial<Curriculum>) =>
    api.post<Curriculum>('/admin/curriculums', data),

  update: (id: string, data: Partial<Curriculum>) =>
    api.patch<Curriculum>(`/admin/curriculums/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/curriculums/${id}`),

  // Admin: get curriculum with all items
  getWithItems: (id: string) =>
    api.get<Curriculum>(`/curriculums/${id}`),

  // Admin: bulk CSV import
  importCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/curriculums/import', fd);
  },
};
