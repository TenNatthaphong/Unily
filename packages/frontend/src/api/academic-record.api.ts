import api from './axios';
import type { AcademicRecord, StudentProfile } from '../types';

export interface GpaxStats {
  gpax: number;
  totalCA: number;
  totalCS: number;
  totalGP: number;
}

export interface TranscriptResponse {
  studentInfo: StudentProfile & { 
    user: { firstName: string, lastName: string },
    faculty: { nameTh: string, nameEn: string },
    department: { nameTh: string, nameEn: string }
  };
  records: AcademicRecord[];
  summary: GpaxStats;
}

export interface GraduationStatus {
  studentCode: string;
  gpax: number;
  totalCredits: number;
  graduationStatus: {
    isEligible: boolean;
    missingCompulsory: number;
    creditsStatus: string;
  };
  electiveStats: Record<string, number>;
}

export const academicRecordApi = {
  // Student own records
  getMyTranscript: () =>
    api.get<TranscriptResponse>('/academic-records/my/transcript'),

  getMyStats: () =>
    api.get<GpaxStats>('/academic-records/my/gpax'),

  getMyGraduation: () =>
    api.get<GraduationStatus>('/academic-records/my/graduation'),

  // Professor/Admin: view student records
  getStudentTranscript: (studentId: string) =>
    api.get<TranscriptResponse>(`/academic-records/student/${studentId}/transcript`),

  getStudentStats: (studentId: string) =>
    api.get<GpaxStats>(`/academic-records/student/${studentId}/gpax`),
};
