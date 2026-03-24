import api from './axios';
import type { SemesterConfig, User, AuditLog, PaginatedResponse, Section } from '../types';

export const adminApi = {
  // --- Semester Config (CRUD) ---
  getSemesterConfigs: () =>
    api.get<SemesterConfig[]>('/admin/settings/semester'),

  updateSemesterConfig: (id: string, data: Partial<SemesterConfig>) =>
    api.patch(`/admin/settings/semester/${id}`, data),

  createSemesterConfig: (data: Partial<SemesterConfig>) =>
    api.post<SemesterConfig>('/admin/settings/semester', data),

  deleteSemesterConfig: (id: string) =>
    api.delete(`/admin/settings/semester/${id}`),

  closeSemester: (academicYear: number, semester: number) =>
    api.post('/config/semester/close', { academicYear, semester }),

  // --- Sections Management ---
  createSection: (data: any) =>
    api.post<Section>('/section', data),

  updateSection: (id: string, data: any) =>
    api.patch<Section>(`/section/${id}`, data),

  deleteSection: (id: string) =>
    api.delete(`/section/${id}`),

  getAllSections: (params: { page: number; limit: number; academicYear?: number; semester?: number; search?: string }) =>
    api.get<PaginatedResponse<Section>>('/admin/sections', { params }), // Assuming backend has this under admin

  // --- Universal CSV Import ---
  importUsersCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/admin/users/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  importCoursesCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/courses/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  importSectionsCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/section/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  importCurriculumCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/curriculums/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // --- Users ---
  getUsers: (params: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),

  suspendUser: (userId: string) =>
    api.patch(`/admin/users/${userId}/suspend`),

  // --- Audit Log ---
  getAuditLogs: (params: { page?: number; limit?: number; action?: string; adminName?: string }) =>
    api.get<PaginatedResponse<AuditLog>>('/admin/audit-log', { params }),
};
