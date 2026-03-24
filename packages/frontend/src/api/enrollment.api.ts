import api from './axios';
import type { Enrollment, Section } from '../types';

export const enrollmentApi = {
  getMyEnrollments: (academicYear?: number, semester?: number) =>
    api.get<Enrollment[]>('/enrollment/my', { params: { academicYear, semester } }),

  getSectionsByCourse: (courseId: string, academicYear?: number, semester?: number) =>
    api.get<Section[]>('/section', { params: { courseId, academicYear, semester } }),

  enroll: (sectionId: string) =>
    api.post<Enrollment>('/enrollment', { sectionId }),

  drop: (enrollmentId: string) =>
    api.delete(`/enrollment/${enrollmentId}`),
};
