import api from './axios';
import type { Enrollment, Section } from '../types';

export const enrollmentApi = {
  getMyEnrollments: (academicYear?: number, semester?: number) =>
    api.get<Enrollment[]>('/enrollments/my', { params: { academicYear, semester } }),

  getSectionsByCourse: (courseId: string, academicYear?: number, semester?: number) =>
    api.get<Section[]>('/sections', { params: { courseId, academicYear, semester } }),

  enroll: (sectionId: string) =>
    api.post<Enrollment>('/enrollments', { sectionId }),

  drop: (sectionId: string) =>
    api.delete(`/enrollments/drop/${sectionId}`),
};
