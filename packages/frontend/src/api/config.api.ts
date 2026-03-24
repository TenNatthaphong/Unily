import api from './axios';
import type { SemesterConfig, Event } from '../types';

export const configApi = {
  getCurrentSemester: () =>
    api.get<SemesterConfig>('/config/semester/current'),

  getEvents: () =>
    api.get<Event[]>('/events'),

  // Admin events
  createEvent: (data: Partial<Event>) =>
    api.post<Event>('/admin/events', data),

  updateEvent: (id: string, data: Partial<Event>) =>
    api.patch<Event>(`/admin/events/${id}`, data),

  deleteEvent: (id: string) =>
    api.delete(`/admin/events/${id}`),
};
