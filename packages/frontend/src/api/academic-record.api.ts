import api from './axios';
import type { AcademicRecord } from '../types';

export interface GpaxStats {
  gpax: number;
  totalCredits: number;
  passedCourses: number;
  totalCourses: number;
}

export interface GraduationStatus {
  studentCode: string;
  gpax: number;
  totalCredits: number;
  graduationStatus: {
    isEligible: boolean;
    missingCompulsory: number;
    creditsStatus: string;
    electiveStats: Record<string, number>;
  };
}

export const academicRecordApi = {
  // Student own records
  getMyTranscript: () =>
    api.get<AcademicRecord[]>('/academic-records/my/transcript'),

  getMyStats: () =>
    api.get<GpaxStats>('/academic-records/my/gpax'),

  getMyGraduation: () =>
    api.get<GraduationStatus>('/academic-records/my/graduation'),

  // Professor/Admin: view student records
  getStudentTranscript: (studentId: string) =>
    api.get<AcademicRecord[]>(`/academic-records/student/${studentId}/transcript`),

  getStudentStats: (studentId: string) =>
    api.get<GpaxStats>(`/academic-records/student/${studentId}/gpax`),
};
