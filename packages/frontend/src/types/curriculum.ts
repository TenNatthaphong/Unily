export interface Course {
  id: string;
  name: string;
  credit: number;
  category: string;
  deptId?: string;
}

export interface CurriculumCourse {
  id: string;
  curriculumId: string;
  courseId: string;
  semester: number;
  year: number;
  positionX: number;
  positionY: number;
  course: Course; // ข้อมูลวิชาที่จอยมา
}