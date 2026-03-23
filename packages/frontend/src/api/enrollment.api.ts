import api from './axios';
import type { Enrollment, Section } from '../types';

export const enrollmentApi = {
  // Get my enrollments for current semester
  getMyEnrollments: (academicYear?: number, semester?: number) =>
    api.get<Enrollment[]>('/enrollment/my', { params: { academicYear, semester } }),

  // Search sections/courses
  searchSections: (params: { q?: string; facultyId?: string; deptId?: string; academicYear?: number; semester?: number }) =>
    api.get<Section[]>('/enrollment/search', { params }),

  // Enroll in a section
  enroll: (sectionId: string) =>
    api.post<Enrollment>('/enrollment', { sectionId }),

  // Drop a section
  drop: (enrollmentId: string) =>
    api.delete(`/enrollment/${enrollmentId}`),
};
