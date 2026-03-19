// src/app/admin/components/mock-data.ts

export type Role = 'student' | 'professor' | 'admin';

export type CourseCategory = 'required' | 'elective' | 'general' | 'free';

export interface Course {
  id: string;
  nameEn: string;
  nameTh: string;
  credits: number;
  lectureHours: number;
  labHours: number;
  selfStudyHours: number;
  category: CourseCategory;
  isWildcard?: boolean;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface Prerequisite {
  id: string;
  courseId: string;
  preCourseId: string;
  type: 'PREREQUISITE' | 'COREQUISITE';
}

export interface CurriculumCourse {
  id: string;
  curriculumId: string;
  courseId: string;
  semester: number;
  year: number;
  positionX: number;
  positionY: number;
  course?: Course;
}

export const projectId = "mock-project-id";
export const publicAnonKey = "mock-anon-key";

export const getCategoryLabel = (cat: CourseCategory): string => {
  switch (cat) {
    case 'required': return 'วิชาบังคับ';
    case 'elective': return 'วิชาเลือก';
    case 'general': return 'ศึกษาทั่วไป';
    case 'free': return 'เลือกเสรี';
    default: return cat;
  }
};

export const getCategoryColor = (cat: CourseCategory): string => {
  switch (cat) {
    case 'required': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'elective': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'general': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'free': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const mockUsers: User[] = [
  { id: 'u1', username: 'student01', firstName: 'สมชาย', lastName: 'ใจดี', email: 'student01@uniy.ac.th', role: 'student' },
  { id: 'u2', username: 'prof01', firstName: 'วิชัย', lastName: 'ปราชญ์', email: 'prof01@uniy.ac.th', role: 'professor' },
  { id: 'u3', username: 'admin01', firstName: 'สมศักดิ์', lastName: 'ผู้ดูแล', email: 'admin01@uniy.ac.th', role: 'admin' },
];
