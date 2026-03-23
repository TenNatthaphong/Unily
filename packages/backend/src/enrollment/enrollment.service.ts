import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { isTimeOverlapping } from '../common/utils/time.util';
import { Grade, CourseCategory } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async getCreditLimits(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!student?.curriculumId) return { min: 9, max: 22 };

    const passed = await this.prisma.academicRecord.findMany({
      where: { studentId, grade: { not: Grade.F } },
      select: { courseId: true }
    });

    const remaining = await this.prisma.curriculumCourse.findMany({
      where: { curriculumId: student.curriculumId, courseId: { notIn: passed.map(p => p.courseId) } },
      include: { course: { select: { credits: true } } }
    });

    const totalRemaining = remaining.reduce((sum, item) => sum + item.course.credits, 0);
    return (totalRemaining > 0 && totalRemaining < 9) ? { min: 1, max: 22 } : { min: 9, max: 22 };
  }

  // ===========================================================================
  // PUBLIC ACTIONS
  // ===========================================================================

  async create(dto: CreateEnrollmentDto) {
    const { studentId, sectionId } = dto;
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { schedules: true, course: { include: { prerequisites: true } } }
    });

    if (!section) throw new NotFoundException('Section not found');

    // 1. Check if already passed or enrolled
    const alreadyPassed = await this.prisma.academicRecord.findFirst({
      where: { studentId, courseId: section.courseId, grade: { not: Grade.F } }
    });
    if (alreadyPassed) throw new BadRequestException('You have already passed this course.');

    // 2. Check Prerequisites
    if (section.course.prerequisites.length > 0) {
      const prereqs = section.course.prerequisites.map(p => p.requiresCourseId);
      const passedCount = await this.prisma.academicRecord.count({
        where: { studentId, courseId: { in: prereqs }, grade: { not: Grade.F } }
      });
      if (passedCount < prereqs.length) throw new BadRequestException('Prerequisite required');
    }

    // 3. Check Schedule Conflicts
    const existing = await this.prisma.enrollment.findMany({
      where: { studentId, academicYear: section.academicYear, semester: section.semester },
      include: { section: { include: { schedules: true, course: true } } }
    });

    for (const enr of existing) {
      if (enr.section.courseId === section.courseId) throw new ConflictException('Already enrolled in this course.');
      for (const s1 of section.schedules) {
        for (const s2 of enr.section.schedules) {
          if (s1.dayOfWeek === s2.dayOfWeek && isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            throw new ConflictException(`Schedule conflict with ${enr.section.course.courseCode}`);
          }
        }
      }
    }

    // 4. Credit Limit Check (Co-op can bypass max credits)
    const currentCredits = existing.reduce((sum, e) => sum + e.section.course.credits, 0);
    const limits = await this.getCreditLimits(studentId);
    if (section.course.category !== CourseCategory.COOP_COURSE && (currentCredits + section.course.credits) > limits.max) {
      throw new BadRequestException(`Credits exceed limit (Max: ${limits.max})`);
    }

    // 5. Atomic Transaction
    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: { studentId, sectionId, academicYear: section.academicYear, semester: section.semester, status: 'ENROLLED' }
      });
      await tx.section.update({ where: { id: sectionId }, data: { enrolledCount: { increment: 1 } } });
      return enrollment;
    });
  }

  async drop(studentId: string, sectionId: string) {
    const enr = await this.prisma.enrollment.findUnique({ where: { studentId_sectionId: { studentId, sectionId } } });
    if (!enr) throw new NotFoundException('Enrollment not found');
    if (enr.status === 'SUCCESS') throw new BadRequestException('Cannot drop a graded course');

    return this.prisma.$transaction(async (tx) => {
      await tx.enrollment.delete({ where: { id: enr.id } });
      await tx.section.update({ where: { id: sectionId }, data: { enrolledCount: { decrement: 1 } } });
      return { message: 'Dropped successfully' };
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: { section: { include: { course: true, schedules: true } } }
    });
  }

  async findByStudentAndTerm(studentId: string, yr: number, sem: number) {
    return this.prisma.enrollment.findMany({
      where: { studentId, academicYear: yr, semester: sem },
      include: { section: { include: { course: true, schedules: true } } }
    });
  }
}
