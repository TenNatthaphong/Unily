import api from './axios';
import type { Section, Enrollment } from '../types';

export const professorApi = {
  // Get sections taught by the professor
  getMySections: (academicYear?: number, semester?: number) =>
    api.get<Section[]>('/section/my', { params: { academicYear, semester } }),

  // Get students in a specific section
  getSectionStudents: (sectionId: string) =>
    api.get<Enrollment[]>(`/section/${sectionId}/students`),

  // Submit/Update grade for a student
  updateGrade: (enrollmentId: string, totalScore: number) =>
    api.patch(`/enrollment/${enrollmentId}/grade`, { totalScore }),
};
