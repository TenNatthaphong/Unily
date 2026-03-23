import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateGPAX } from '../common/utils/grade.util';
import { getElectiveName, isElective } from '../common/utils/elective.util';
import { Grade } from '@prisma/client';

@Injectable()
export class AcademicRecordService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // GRADUATION LOGIC
  // ===========================================================================

  async checkGraduationRequirement(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { curriculum: { include: { curriculumCourses: true } } }
    });

    if (!student?.curriculum) throw new NotFoundException('Student profile or curriculum not found');

    const passed = await this.prisma.academicRecord.findMany({
      where: { studentId, grade: { not: Grade.F } },
      include: { course: true }
    });

    const passedIds = new Set(passed.map(r => r.courseId));
    const required = student.curriculum.curriculumCourses;
    const missing = required.filter(item => !passedIds.has(item.courseId));

    // Grouping by human-readable names as source of truth
    const electiveStats = passed.reduce((acc, rec) => {
      const cat = rec.course.category;
      const key = isElective(cat) ? getElectiveName(cat) : 'Compulsory';
      acc[key] = (acc[key] || 0) + rec.cs;
      return acc;
    }, {} as Record<string, number>);

    const stats = calculateGPAX(passed);
    const totalMet = stats.totalCS >= (student.curriculum.totalCredits || 128);

    return {
      studentCode: student.studentCode,
      gpax: stats.gpax,
      totalCredits: stats.totalCS,
      graduationStatus: {
        isEligible: missing.length === 0 && totalMet,
        missingCompulsory: missing.length,
        creditsStatus: `${stats.totalCS}/${student.curriculum.totalCredits || 128}`
      },
      electiveStats
    };
  }

  // ===========================================================================
  // DATA QUERIES
  // ===========================================================================

  async findByStudent(studentId: string) {
    return this.prisma.academicRecord.findMany({
      where: { studentId },
      include: { course: { select: { courseCode: true, nameEn: true, nameTh: true, credits: true, category: true } } },
      orderBy: [{ academicYear: 'asc' }, { semester: 'asc' }]
    });
  }

  async findByStudentAndTerm(studentId: string, yr: number, sem: number) {
    return this.prisma.academicRecord.findMany({
      where: { studentId, academicYear: yr, semester: sem },
      include: { course: true }
    });
  }

  async getTranscript(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { user: { select: { firstName: true, lastName: true } }, faculty: true, department: true }
    });
    if (!student) throw new NotFoundException('Student not found');
    
    const records = await this.findByStudent(studentId);
    return { studentInfo: student, records, summary: calculateGPAX(records) };
  }

  async getGPAX(studentId: string) {
    const records = await this.findByStudent(studentId);
    return calculateGPAX(records);
  }
}
