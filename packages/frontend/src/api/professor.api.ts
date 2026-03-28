import api from './axios';
import type { Section, Enrollment } from '../types';

export const professorApi = {
  // Get sections taught by the professor
  getMySections: (academicYear?: number, semester?: number) =>
    api.get<Section[]>('/section/my', { params: { academicYear, semester } }),

  // Get students in a specific section
  getSectionStudents: (sectionId: string) =>
    api.get<Enrollment[]>(`/section/${sectionId}/students`),

  // Bulk update scores for all students in a section
  updateSectionGrades: (sectionId: string, grades: { studentId: string; midtermScore?: number; finalScore?: number }[]) =>
    api.patch(`/section/${sectionId}/grades`, { grades }),
};
