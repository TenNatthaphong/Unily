// ================================================================
// ENUMS (mirror Prisma)
// ================================================================
export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type StudentStatus = 'STUDYING' | 'GRADUATED' | 'RETIRED';
export type CourseCategory = 'GENERAL_EDUCATION' | 'CORE_COURSE' | 'REQUIRED_COURSE' | 'MAJOR_ELECTIVE' | 'FREE_ELECTIVE' | 'COOP_COURSE';
export type EnrollmentStatus = 'SUCCESS' | 'DROPPED' | 'ENROLLED';
export type CurriculumStatus = 'ACTIVE' | 'INACTIVE';
export type EventCategory = 'GENERAL' | 'ACADEMIC' | 'EXAM' | 'HOLIDAY' | 'ACTIVITY';
export type Action = 'CREATE' | 'UPDATE' | 'DELETE';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type Grade = 'A' | 'B_PLUS' | 'B' | 'C_PLUS' | 'C' | 'D_PLUS' | 'D' | 'F';

// ================================================================
// USER & AUTH
// ================================================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  studentProfile?: StudentProfile;
  professorProfile?: ProfessorProfile;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StudentProfile {
  userId: string;
  studentCode: string;
  facultyId: string;
  deptId: string;
  entryYear: number;
  year: number;
  gpax: number;
  status: StudentStatus;
  ca: number;
  cs: number;
  curriculumId?: string;
  user?: User;
  department?: Department;
  faculty?: Faculty;
}

export interface ProfessorProfile {
  userId: string;
  facultyId: string;
  deptId: string;
  user?: { firstName: string; lastName: string };
}

// ================================================================
// ORGANIZATION
// ================================================================
export interface Faculty {
  id: string;
  facultyCode: string;
  nameTh: string;
  nameEn: string;
  _count?: { departments: number };
}

export interface Department {
  id: string;
  facultyCode: string;
  deptCode: string;
  shortName: string;
  nameTh: string;
  nameEn: string;
  facultyId: string;
}

// ================================================================
// COURSES & CURRICULUM
// ================================================================
export interface Course {
  id: string;
  courseCode: string;
  nameTh: string;
  nameEn: string;
  credits: number;
  labHours: number;
  lectureHours: number;
  selfStudyHours: number;
  category: CourseCategory;
  isWildcard: boolean;
  deptId: string;
  facultyId: string;
  prerequisites?: Prerequisite[];
  sections?: Section[];
}

export interface Prerequisite {
  id: string;
  courseId: string;
  requiresCourseId: string;
  requiresCourse?: Pick<Course, 'id' | 'courseCode' | 'nameTh'>;
}

export interface Curriculum {
  id: string;
  curriculumCode: string;
  name: string;
  description?: string;
  note?: string;
  year: number;
  deptId: string;
  facultyId: string;
  status: CurriculumStatus;
  totalCredits: number;
  curriculumCourses?: CurriculumCourse[];
  _count?: { curriculumCourses: number };
}

export interface CurriculumCourse {
  id: string;
  curriculumId: string;
  courseId: string;
  year: number;
  semester: number;
  positionX: number;
  positionY: number;
  mappingPattern?: string;
  course?: Course;
}

// ================================================================
// SECTIONS & SCHEDULES
// ================================================================
export interface Section {
  id: string;
  courseId: string;
  professorId: string;
  sectionNo: number;
  capacity: number;
  enrolledCount: number;
  academicYear: number;
  semester: number;
  course?: Course;
  professor?: ProfessorProfile;
  schedules?: Schedule[];
}

export interface Schedule {
  id: string;
  sectionId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
}

// ================================================================
// ENROLLMENT & RECORDS
// ================================================================
export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  status: EnrollmentStatus;
  academicYear: number;
  semester: number;
  midtermScore: number;
  finalScore: number;
  totalScore: number;
  grade?: Grade;
  section?: Section;
  student?: StudentProfile;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  courseId: string;
  academicYear: number;
  semester: number;
  ca: number;
  cg: number;
  cs: number;
  gp: number;
  gpa: number;
  grade: Grade;
  course?: Course;
}

// ================================================================
// CONFIG & EVENTS
// ================================================================
export interface SemesterConfig {
  id: string;
  academicYear: number;
  semester: number;
  regStart: string;
  regEnd: string;
  withdrawStart: string;
  withdrawEnd: string;
  isCurrent: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  category: EventCategory;
  imgUrl?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  target: string;
  action: Action;
  createdAt: string;
}

// ================================================================
// API HELPERS
// ================================================================
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}
