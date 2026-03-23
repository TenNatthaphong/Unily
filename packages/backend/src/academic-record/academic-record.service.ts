import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateGPAX } from '../common/utils/grade.util';
import { Grade, StudentStatus, CourseCategory } from '@prisma/client';

@Injectable()
export class AcademicRecordService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ตรวจสอบความถูกต้องของการจบการศึกษา (Graduation Checker)
   * เช็คความครบกลุ่มวิชา ไม่ใช่แค่จำนวนหน่วยกิตรวม
   */
  async checkGraduationRequirement(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { 
        curriculum: { 
          include: { curriculumCourses: true } 
        } 
      }
    });

    if (!student || !student.curriculum) throw new NotFoundException('Student or Curriculum not found');

    const passedRecords = await this.prisma.academicRecord.findMany({
      where: { studentId, grade: { not: Grade.F } },
      include: { course: true }
    });

    const passedCourseIds = new Set(passedRecords.map(r => r.courseId));
    
    // 1. แยกกลุ่มวิชาที่หลักสูตรต้องการ
    const requiredItems = student.curriculum.curriculumCourses; 
    const missingCore = requiredItems.filter(item => !passedCourseIds.has(item.courseId));

    // 2. เช็คหน่วยกิตขั้นต่ำตามประเภท (Category Summary)
    const categoryStats = passedRecords.reduce((acc, rec) => {
        const cat = rec.course.category;
        acc[cat] = (acc[cat] || 0) + rec.cs;
        return acc;
    }, {} as Record<string, number>);

    const overall = calculateGPAX(passedRecords);

    const isMissingCore = missingCore.length > 0;
    const isTotalCreditsMet = overall.totalCS >= (student.curriculum.totalCredits || 128);

    return {
      studentCode: student.studentCode,
      gpax: overall.gpax,
      totalCredits: overall.totalCS,
      status: {
        isMet: !isMissingCore && isTotalCreditsMet,
        reasons: [
            isMissingCore ? `ยังขาดวิชาบังคับ ${missingCore.length} วิชา` : null,
            !isTotalCreditsMet ? `ยังเก็บหน่วยกิตไม่ครบ (ได้ ${overall.totalCS}/${student.curriculum.totalCredits})` : null
        ].filter(v => v !== null)
      },
      missingCoreIds: missingCore.map(m => m.courseId),
      categoryStats
    };
  }

  async findByStudent(studentId: string) {
    return this.prisma.academicRecord.findMany({
      where: { studentId },
      include: { course: true 
      },
      orderBy: [{ academicYear: 'asc' }, { semester: 'asc' }],
    });
  }

  async findByStudentAndTerm(studentId: string, academicYear: number, semester: number) {
    return this.prisma.academicRecord.findMany({
      where: { studentId, academicYear, semester },
      include: { course: true },
    });
  }

  async getTranscript(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { user: { select: { firstName: true, lastName: true } }, faculty: true, department: true }
    });
    if (!student) throw new NotFoundException('Student not found');
    const records = await this.findByStudent(studentId);
    const overall = calculateGPAX(records);
    return { studentInfo: student, records, cumulative: overall };
  }

  async getGPAX(studentId: string) {
    const records = await this.findByStudent(studentId);
    return calculateGPAX(records);
  }
}
