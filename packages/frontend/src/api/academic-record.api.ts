import api from './axios';
import type { AcademicRecord } from '../types';

export const academicRecordApi = {
  // Get my academic records grouped by semester
  getMyTranscript: () =>
    api.get<AcademicRecord[]>('/academic-records/my'),

  // Get GPAX and total credits
  getMyStats: () =>
    api.get<{ gpax: number; totalCredits: number }>('/academic-records/my/stats'),
};
