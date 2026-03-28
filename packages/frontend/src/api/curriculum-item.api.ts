import api from './axios';
import type { CurriculumCourse } from '../types';

export interface FlowItem {
  courseId: string;
  year: number;
  semester: number;
  positionX: number;
  positionY: number;
  mappingPattern?: string;
}

export const curriculumItemApi = {
  // Get items for a curriculum (by curriculum code or ID)
  getByCurriculumCode: (code: string) =>
    api.get<CurriculumCourse[]>('/curriculum-items', { params: { code } }),

  getByCurriculumId: (id: string) =>
    api.get<CurriculumCourse[]>('/curriculum-items', { params: { id } }),

  // Admin: sync flow (delete all + re-create)
  syncFlow: (curriculumId: string, items: FlowItem[]) =>
    api.put(`/admin/curriculum-items/${curriculumId}/flow`, { items }),
};
