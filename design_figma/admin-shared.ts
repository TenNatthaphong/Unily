// ==================== Admin Shared Types & Mock Data ====================
import { projectId, publicAnonKey } from '/utils/supabase/info';

export const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-105269f1`;
export const API_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

// Faculty / Department mapping
export const faculties = [
  { id: '04', name: 'คณะวิทยาศาสตร์' },
];

export const departments = [
  { id: '06', name: 'ภาควิชาวิทยาการคอมพิวเตอร์', facultyId: '04' },
];

export function getFacultyName(id: string) {
  return faculties.find(f => f.id === id)?.name ?? id;
}
export function getDeptName(id: string) {
  return departments.find(d => d.id === id)?.name ?? id;
}

// Mock admin users for activity log
export const mockAdmins = [
  { id: 'a1', name: 'Admin สมศักดิ์', avatar: 'สศ' },
  { id: 'a2', name: 'Admin วิภา', avatar: 'วภ' },
  { id: 'a3', name: 'Admin ปิยะ', avatar: 'ปย' },
];

// Activity log types
export type ActivityType = 'create' | 'update' | 'delete' | 'config' | 'approve';

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: ActivityType;
  description: string;
  target: string;
  timestamp: string;
  date: string;
}

export const mockActivities: ActivityLog[] = [
  { id: 'act1', adminId: 'a1', adminName: 'Admin สมศักดิ์', action: 'update', description: 'อัปเดตหลักสูตรวิทยาการคอมพิวเตอร์ พ.ศ.2568', target: 'หลักสูตร', timestamp: '14:30', date: '2026-03-11' },
  { id: 'act2', adminId: 'a2', adminName: 'Admin วิภา', action: 'create', description: 'เพิ่มรายวิชา CS403 Deep Learning', target: 'รายวิชา', timestamp: '11:20', date: '2026-03-11' },
  { id: 'act3', adminId: 'a1', adminName: 'Admin สมศักดิ์', action: 'config', description: 'เปิดลงทะเบียนเรียน ภาคเรียน 1/2569', target: 'ตั้งค่า', timestamp: '09:00', date: '2026-03-11' },
  { id: 'act4', adminId: 'a3', adminName: 'Admin ปิยะ', action: 'update', description: 'แก้ไขข้อมูล Section CS101 Sec 2 — เปลี่ยนอาจารย์ผู้สอน', target: 'Section', timestamp: '16:45', date: '2026-03-10' },
  { id: 'act5', adminId: 'a2', adminName: 'Admin วิภา', action: 'create', description: 'สร้างกิจกรรม "วันเปิดลงทะเบียน 1/2569"', target: 'ปฏิทิน', timestamp: '10:30', date: '2026-03-10' },
  { id: 'act6', adminId: 'a1', adminName: 'Admin สมศักดิ์', action: 'delete', description: 'ลบ Section CS499 Sec 3 (ไม่มีผู้ลงทะเบียน)', target: 'Section', timestamp: '15:00', date: '2026-03-09' },
  { id: 'act7', adminId: 'a3', adminName: 'Admin ปิยะ', action: 'approve', description: 'อนุมัติหลักสูตรใหม่ คณะวิทยาศาสตร์ ปี 2569', target: 'หลักสูตร', timestamp: '14:00', date: '2026-03-09' },
  { id: 'act8', adminId: 'a2', adminName: 'Admin วิภา', action: 'update', description: 'แก้ไขกำหนดการ "วันสอบปลายภาค" เลื่อนเป็น 20 เม.ย.', target: 'ปฏิทิน', timestamp: '11:00', date: '2026-03-08' },
  { id: 'act9', adminId: 'a1', adminName: 'Admin สมศักดิ์', action: 'config', description: 'ปิดการลงทะเบียนเพิ่ม-ถอน ภาคเรียน 2/2568', target: 'ตั้งค่า', timestamp: '09:30', date: '2026-03-07' },
  { id: 'act10', adminId: 'a3', adminName: 'Admin ปิยะ', action: 'create', description: 'เพิ่มผู้ใช้ใหม่ ดร.สมหญิง นักวิจัย (อาจารย์)', target: 'ผู้ใช้', timestamp: '13:15', date: '2026-03-07' },
];

// Calendar/Event types
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'registration' | 'exam' | 'holiday' | 'event' | 'deadline';
  bannerUrl?: string;
}

export const mockEvents: CalendarEvent[] = [
  { id: 'ev1', title: 'เปิดลงทะเบียนเรียน 1/2569', description: 'นักศึกษาสามารถลงทะเบียนเรียนผ่านระบบ UNIy ได้ตั้งแต่วันนี้', startDate: '2026-06-01', endDate: '2026-06-14', type: 'registration' },
  { id: 'ev2', title: 'วันเปิดภาคเรียน 1/2569', description: 'เปิดเรียนวันแรกของภาคเรียนที่ 1 ปีการศึกษา 2569', startDate: '2026-06-15', endDate: '2026-06-15', type: 'event' },
  { id: 'ev3', title: 'วันสุดท้ายเพิ่ม-ถอนวิชา', description: 'วันสุดท้ายสำหรับการเพิ่มหรือถอนรายวิชาโดยไม่ติด W', startDate: '2026-06-28', endDate: '2026-06-28', type: 'deadline' },
  { id: 'ev4', title: 'สอบกลางภาค 1/2569', description: 'ช่วงสอบกลางภาคเรียนที่ 1', startDate: '2026-08-10', endDate: '2026-08-14', type: 'exam' },
  { id: 'ev5', title: 'วันหยุดชดเชยวันสงกรานต์', description: 'หยุดราชการ', startDate: '2026-04-14', endDate: '2026-04-16', type: 'holiday' },
  { id: 'ev6', title: 'สอบปลายภาค 1/2569', description: 'ช่วงสอบปลายภาคเรียนที่ 1', startDate: '2026-10-05', endDate: '2026-10-16', type: 'exam' },
  { id: 'ev7', title: 'งาน Open House คณะวิทยาศาสตร์', description: 'งานเปิดบ้านคณะวิทยาศาสตร์ต้อนรับนักเรียน ม.6', startDate: '2026-11-15', endDate: '2026-11-16', type: 'event' },
];

export const eventTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  registration: { label: 'ลงทะเบียน', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  exam: { label: 'สอบ', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  holiday: { label: 'วันหยุด', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  event: { label: 'กิจกรรม', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  deadline: { label: 'กำหนดส่ง', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

// Curriculum list mock
export interface CurriculumInfo {
  id: string;
  name: string;
  nameEn: string;
  facultyId: string;
  deptId: string;
  year: number;
  totalCredits: number;
  status: 'active' | 'draft' | 'archived';
}

export const mockCurricula: CurriculumInfo[] = [
  { id: 'cur1', name: 'วิทยาการคอมพิวเตอร์', nameEn: 'Computer Science', facultyId: '04', deptId: '06', year: 2568, totalCredits: 136, status: 'active' },
  { id: 'cur2', name: 'วิทยาการคอมพิวเตอร์', nameEn: 'Computer Science', facultyId: '04', deptId: '06', year: 2563, totalCredits: 132, status: 'archived' },
  { id: 'cur3', name: 'วิทยาการคอมพิวเตอร์ (ปรับปรุง)', nameEn: 'Computer Science (Revised)', facultyId: '04', deptId: '06', year: 2569, totalCredits: 138, status: 'draft' },
];

// Section mock with schedules
export interface MockSection {
  id: string;
  courseId: string;
  sectionNo: number;
  capacity: number;
  enrolledCount: number;
  semester: number;
  academicYear: number;
  professorId: string;
  professorName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export const mockSectionsDetailed: MockSection[] = [
  { id: 's1', courseId: 'CS101', sectionNo: 1, capacity: 60, enrolledCount: 45, semester: 1, academicYear: 2569, professorId: 'p1', professorName: 'ดร.วิชัย ปราชญ์', day: 'จันทร์', startTime: '09:00', endTime: '12:00', room: 'SC4-201' },
  { id: 's2', courseId: 'CS101', sectionNo: 2, capacity: 60, enrolledCount: 58, semester: 1, academicYear: 2569, professorId: 'p2', professorName: 'ดร.สมศรี สอนดี', day: 'อังคาร', startTime: '13:00', endTime: '16:00', room: 'SC4-202' },
  { id: 's3', courseId: 'CS101', sectionNo: 3, capacity: 60, enrolledCount: 60, semester: 1, academicYear: 2569, professorId: 'p1', professorName: 'ดร.วิชัย ปราชญ์', day: 'พุธ', startTime: '09:00', endTime: '12:00', room: 'SC4-201' },
  { id: 's4', courseId: 'CS102', sectionNo: 1, capacity: 50, enrolledCount: 48, semester: 1, academicYear: 2569, professorId: 'p1', professorName: 'ดร.วิชัย ปราชญ์', day: 'พฤหัสบดี', startTime: '09:00', endTime: '12:00', room: 'SC4-301' },
  { id: 's5', courseId: 'CS102', sectionNo: 2, capacity: 50, enrolledCount: 32, semester: 1, academicYear: 2569, professorId: 'p3', professorName: 'ผศ.ดร.ประยุทธ คำนวน', day: 'ศุกร์', startTime: '09:00', endTime: '12:00', room: 'SC4-301' },
  { id: 's6', courseId: 'CS201', sectionNo: 1, capacity: 50, enrolledCount: 38, semester: 1, academicYear: 2569, professorId: 'p2', professorName: 'ดร.สมศรี สอนดี', day: 'จันทร์', startTime: '13:00', endTime: '16:00', room: 'SC4-401' },
  { id: 's7', courseId: 'CS202', sectionNo: 1, capacity: 50, enrolledCount: 42, semester: 1, academicYear: 2569, professorId: 'p3', professorName: 'ผศ.ดร.ประยุทธ คำนวน', day: 'อังคาร', startTime: '09:00', endTime: '12:00', room: 'SC4-402' },
  { id: 's8', courseId: 'CS301', sectionNo: 1, capacity: 40, enrolledCount: 35, semester: 1, academicYear: 2569, professorId: 'p1', professorName: 'ดร.วิชัย ปราชญ์', day: 'พุธ', startTime: '13:00', endTime: '16:00', room: 'SC4-501' },
  { id: 's9', courseId: 'MATH101', sectionNo: 1, capacity: 80, enrolledCount: 72, semester: 1, academicYear: 2569, professorId: 'p4', professorName: 'รศ.ดร.สมชาติ คณิตศาสตร์', day: 'จันทร์', startTime: '09:00', endTime: '12:00', room: 'SC2-101' },
  { id: 's10', courseId: 'MATH101', sectionNo: 2, capacity: 80, enrolledCount: 65, semester: 1, academicYear: 2569, professorId: 'p4', professorName: 'รศ.ดร.สมชาติ คณิตศาสตร์', day: 'พฤหัสบดี', startTime: '09:00', endTime: '12:00', room: 'SC2-101' },
  { id: 's11', courseId: 'GEN101', sectionNo: 1, capacity: 100, enrolledCount: 87, semester: 1, academicYear: 2569, professorId: 'p5', professorName: 'อ.สุชาดา ภาษาดี', day: 'อังคาร', startTime: '09:00', endTime: '12:00', room: 'LA-201' },
];

// Mock student list for section
export interface MockStudent {
  id: string;
  studentId: string;
  name: string;
  year: number;
  status: 'enrolled' | 'dropped' | 'withdrawn';
}

export const mockStudentsForSection: MockStudent[] = [
  { id: 'st1', studentId: '6501001', name: 'สมชาย ใจดี', year: 1, status: 'enrolled' },
  { id: 'st2', studentId: '6501002', name: 'สมหญิง รักเรียน', year: 1, status: 'enrolled' },
  { id: 'st3', studentId: '6501003', name: 'วิชัย เก่งมาก', year: 1, status: 'enrolled' },
  { id: 'st4', studentId: '6501004', name: 'พิมพ์ใจ สว่าง', year: 1, status: 'enrolled' },
  { id: 'st5', studentId: '6501005', name: 'ธนพล รุ่งเรือง', year: 1, status: 'enrolled' },
  { id: 'st6', studentId: '6501006', name: 'กัญญา มีศรี', year: 1, status: 'dropped' },
  { id: 'st7', studentId: '6501007', name: 'ปิยะ ใจกว้าง', year: 2, status: 'enrolled' },
  { id: 'st8', studentId: '6501008', name: 'สุภาพร ดีมาก', year: 1, status: 'enrolled' },
  { id: 'st9', studentId: '6501009', name: 'อนุชา เรียนดี', year: 2, status: 'withdrawn' },
  { id: 'st10', studentId: '6501010', name: 'นภัสสร สดใส', year: 1, status: 'enrolled' },
];

// Mock all users for user management
export interface AdminUserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  faculty?: string;
  department?: string;
  year?: number;
  status: 'active' | 'inactive';
}

export const mockAllUsersDetailed: AdminUserRecord[] = [
  { id: 'u1', username: 'student01', name: 'สมชาย ใจดี', email: 'student01@uniy.ac.th', role: 'student', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', year: 3, status: 'active' },
  { id: 'u2', username: 'student02', name: 'สมหญิง รักเรียน', email: 'student02@uniy.ac.th', role: 'student', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', year: 2, status: 'active' },
  { id: 'u3', username: 'student03', name: 'วิชัย เก่งมาก', email: 'student03@uniy.ac.th', role: 'student', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', year: 1, status: 'active' },
  { id: 'u4', username: 'student04', name: 'พิมพ์ใจ สว่าง', email: 'student04@uniy.ac.th', role: 'student', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', year: 4, status: 'active' },
  { id: 'u5', username: 'student05', name: 'ธนพล รุ่งเรือง', email: 'student05@uniy.ac.th', role: 'student', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', year: 1, status: 'inactive' },
  { id: 'u6', username: 'prof01', name: 'ดร.วิชัย ปราชญ์', email: 'prof01@uniy.ac.th', role: 'professor', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', status: 'active' },
  { id: 'u7', username: 'prof02', name: 'ดร.สมศรี สอนดี', email: 'prof02@uniy.ac.th', role: 'professor', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', status: 'active' },
  { id: 'u8', username: 'prof03', name: 'ผศ.ดร.ประยุทธ คำนวน', email: 'prof03@uniy.ac.th', role: 'professor', faculty: 'คณะวิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', status: 'active' },
  { id: 'u9', username: 'prof04', name: 'รศ.ดร.สมชาติ คณิตศาสตร์', email: 'prof04@uniy.ac.th', role: 'professor', faculty: 'คณะวิทยาศาสตร์', department: 'คณิตศาสตร์', status: 'active' },
  { id: 'u10', username: 'admin01', name: 'Admin สมศักดิ์', email: 'admin01@uniy.ac.th', role: 'admin', status: 'active' },
  { id: 'u11', username: 'admin02', name: 'Admin วิภา', email: 'admin02@uniy.ac.th', role: 'admin', status: 'active' },
  { id: 'u12', username: 'admin03', name: 'Admin ปิยะ', email: 'admin03@uniy.ac.th', role: 'admin', status: 'active' },
];

// Roadmap data for dashboard
export interface RoadmapItem {
  id: string;
  title: string;
  date: string;
  type: 'registration' | 'exam' | 'holiday' | 'event' | 'deadline';
  done: boolean;
}

export const mockRoadmap: RoadmapItem[] = [
  { id: 'r1', title: 'ปิดการเพิ่ม-ถอน 2/2568', date: '2026-03-07', type: 'deadline', done: true },
  { id: 'r2', title: 'สอบกลางภาค 2/2568', date: '2026-03-16', type: 'exam', done: false },
  { id: 'r3', title: 'วันหยุดสงกรานต์', date: '2026-04-14', type: 'holiday', done: false },
  { id: 'r4', title: 'สอบปลายภาค 2/2568', date: '2026-05-12', type: 'exam', done: false },
  { id: 'r5', title: 'เปิดลงทะเบียน 1/2569', date: '2026-06-01', type: 'registration', done: false },
  { id: 'r6', title: 'วันเปิดเทอม 1/2569', date: '2026-06-15', type: 'event', done: false },
];
