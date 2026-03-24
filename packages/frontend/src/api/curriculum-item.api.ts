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
  // Get all items for a curriculum (by curriculum code)
  getByCurriculumCode: (code: string) =>
    api.get<CurriculumCourse[]>('/curriculum-items', { params: { code } }),

  // Admin: sync flow (delete all + re-create)
  syncFlow: (curriculumId: string, items: FlowItem[]) =>
    api.put(`/admin/curriculum-items/${curriculumId}/flow`, { items }),
};
