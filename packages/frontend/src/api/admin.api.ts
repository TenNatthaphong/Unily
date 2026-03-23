import api from './axios';
import type { SemesterConfig, Event, User } from '../types';

export const adminApi = {
  // --- Semester Config ---
  updateSemesterConfig: (id: string, data: Partial<SemesterConfig>) =>
    api.patch(`/settings/semester/${id}`, data),
    
  closeSemester: (academicYear: number, semester: number) =>
    api.post('/semester/close', { academicYear, semester }),

  // --- Events ---
  createEvent: (data: Partial<Event>) =>
    api.post('/events', data),
    
  updateEvent: (id: string, data: Partial<Event>) =>
    api.patch(`/events/${id}`, data),

  // --- Users ---
  searchUsers: (q: string, role?: string) =>
    api.get<User[]>('/users', { params: { q, role } }),
    
  importUsersCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
