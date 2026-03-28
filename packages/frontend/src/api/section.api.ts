import api from './axios';
import type { Section, Enrollment, PaginatedResponse } from '../types';

export const sectionApi = {
  getByCourse: (courseId: string, academicYear?: number, semester?: number) =>
    api.get<Section[]>('/section', { params: { courseId, academicYear, semester } }),

  getById: (id: string) =>
    api.get<Section>(`/section/${id}`),

  getStudents: (sectionId: string) =>
    api.get<Enrollment[]>(`/section/${sectionId}/students`),

  // Admin
  getAll: (params: { page?: number; limit?: number; academicYear?: number; semester?: number; search?: string }) =>
    api.get<PaginatedResponse<Section>>('/admin/sections', { params }),

  create: (data: Partial<Section> & { schedules?: { dayOfWeek: string; startTime: string; endTime: string }[] }) =>
    api.post<Section>('/admin/sections', data),

  update: (id: string, data: Partial<Section>) =>
    api.patch<Section>(`/admin/sections/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/sections/${id}`),

  // Professor
  getMyTeaching: (academicYear?: number, semester?: number) =>
    api.get<Section[]>('/section/my', { params: { academicYear, semester } }),

  submitGrades: (sectionId: string, grades: { studentId: string; midtermScore: number; finalScore: number }[]) =>
    api.patch(`/section/${sectionId}/grades`, { grades }),
};
