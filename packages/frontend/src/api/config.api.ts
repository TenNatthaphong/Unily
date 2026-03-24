import api from './axios';
import type { SemesterConfig, Event } from '../types';

export const configApi = {
  // Public/Student routes
  getCurrentSemester: () =>
    api.get<SemesterConfig>('/config/semester/current'),

  getEvents: () =>
    api.get<Event[]>('/events'),

  // Public semester list (used by Student Schedule page)
  getPublicSemesters: () =>
    api.get<SemesterConfig[]>('/config/semesters'),

  // --- Admin Settings (Semester Config) ---
  getAllSemesters: () =>
    api.get<SemesterConfig[]>('/admin/settings/semester'),

  createSemester: (data: Partial<SemesterConfig>) =>
    api.post<SemesterConfig>('/admin/settings/semester', data),

  updateSemester: (id: string, data: Partial<SemesterConfig>) =>
    api.patch<SemesterConfig>(`/admin/settings/semester/${id}`, data),

  deleteSemester: (id: string) =>
    api.delete(`/admin/settings/semester/${id}`),

  closeSemester: (data: { academicYear: number; semester: number }) =>
    api.post('/config/semester/close', data),

  // --- Admin Events ---
  createEvent: (data: Partial<Event>) =>
    api.post<Event>('/admin/events', data),

  updateEvent: (id: string, data: Partial<Event>) =>
    api.patch<Event>(`/admin/events/${id}`, data),

  deleteEvent: (id: string) =>
    api.delete(`/admin/events/${id}`),

  // --- Admin Audit Log ---
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; adminName?: string }) =>
    api.get('/admin/audit-log', { params }),
};
