import api from './axios';
import type { Curriculum, CurriculumCourse } from '../types';

export interface CurriculumPlanResponse {
  curriculum: Curriculum;
  plan: (CurriculumCourse & { status: 'COMPLETED' | 'REMAINING' })[];
  stats: {
    totalCredits: number;
    creditsEarned: number;
    gpax: number;
  };
}

export const curriculumApi = {
  // Get all curriculums with optional filtering
  search: (code?: string, facultyId?: string, deptId?: string) =>
    api.get<Curriculum[]>('/curriculums', { params: { code, facultyId, deptId } }),

  // Get current student's curriculum plan and progress
  getMyPlan: () =>
    api.get<CurriculumPlanResponse>('/curriculums/my/plan'),
};
