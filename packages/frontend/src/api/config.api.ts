import api from './axios';
import type { SemesterConfig, Event } from '../types';

export const configApi = {
  getCurrentSemester: () =>
    api.get<SemesterConfig>('/config/semester/current'),

  getEvents: () =>
    api.get<Event[]>('/events'),
};
