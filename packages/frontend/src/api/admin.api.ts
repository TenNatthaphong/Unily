import api from './axios';
import type { SemesterConfig, User, AuditLog, PaginatedResponse } from '../types';

export const adminApi = {
  // --- Semester Config ---
  getSemesterConfigs: () =>
    api.get<SemesterConfig[]>('/admin/settings/semester'),

  updateSemesterConfig: (id: string, data: Partial<SemesterConfig>) =>
    api.patch(`/admin/settings/semester/${id}`, data),

  createSemesterConfig: (data: Partial<SemesterConfig>) =>
    api.post<SemesterConfig>('/admin/settings/semester', data),

  closeSemester: (academicYear: number, semester: number) =>
    api.post('/admin/sections/close-semester', { academicYear, semester }),

  advanceStudentYears: () =>
    api.post('/admin/sections/advance-student-years'),

  // --- Users ---
  getUsers: (params: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),

  suspendUser: (userId: string) =>
    api.patch(`/admin/users/${userId}/suspend`),

  activateUser: (userId: string) =>
    api.patch(`/admin/users/${userId}/activate`),

  importUsersCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateStudentProfile: (userId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/student/${userId}`, data),

  updateProfessorProfile: (userId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/professor/${userId}`, data),

  // --- Audit Log ---
  getAuditLogs: (params: { page?: number; limit?: number; action?: string; adminName?: string }) =>
    api.get<PaginatedResponse<AuditLog>>('/admin/audit-log', { params }),
};
