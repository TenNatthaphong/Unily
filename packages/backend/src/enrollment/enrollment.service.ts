import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { isTimeOverlapping } from '../common/utils/time.util';
import { Grade, CourseCategory } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * คำนวณขีดจำกัดหน่วยกิตขั้นต่ำ/สูงสุดที่ลงได้ในเทอมนี้
   */
  private async getCreditLimits(studentId: string, academicYear: number, semester: number): Promise<{ min: number; max: number }> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!student || !student.curriculumId) return { min: 9, max: 22 };

    // 1. ตรวจสอบวิชาที่เหลือในหลักสูตร (ถ้าเหลือน้อยกว่า 9 ก็ให้ลงต่ำกว่า 9 ได้)
    const passedRecords = await this.prisma.academicRecord.findMany({
      where: { studentId, grade: { not: Grade.F } },
      select: { courseId: true }
    });
    const passedCourseIds = passedRecords.map(r => r.courseId);

    const remainingCourses = await this.prisma.curriculumCourse.findMany({
        where: { 
            curriculumId: student.curriculumId,
            courseId: { notIn: passedCourseIds }
        },
        include: { course: { select: { credits: true } } }
    });

    const totalRemaining = remainingCourses.reduce((sum, item) => sum + item.course.credits, 0);

    // 2. ถ้าหน่วยกิตที่เหลือทั้งหมด < 9 แปลว่าเป็นเทอมสุดท้ายหรือใกล้จบ
    if (totalRemaining > 0 && totalRemaining < 9) {
        return { min: 1, max: 22 };
    }

    return { min: 9, max: 22 };
  }

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { studentId, sectionId } = createEnrollmentDto;

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        schedules: true,
        course: { include: { prerequisites: true } },
      },
    });
    if (!section) throw new NotFoundException('Section not found');

    const alreadyPassed = await this.prisma.academicRecord.findFirst({
        where: { studentId, courseId: section.courseId, grade: { not: Grade.F } }
    });
    if (alreadyPassed) throw new BadRequestException('You have already passed this course.');

    if (section.course.prerequisites.length > 0) {
      const prereqIds = section.course.prerequisites.map(p => p.requiresCourseId);
      const passedCount = await this.prisma.academicRecord.count({
        where: { studentId, courseId: { in: prereqIds }, grade: { not: Grade.F } }
      });
      if (passedCount < prereqIds.length) throw new BadRequestException('ไม่ผ่านวิชาบังคับก่อน (Prerequisite required)');
    }

    const currentEnrollments = await this.prisma.enrollment.findMany({
      where: { studentId, academicYear: section.academicYear, semester: section.semester },
      include: { section: { include: { schedules: true, course: true } } },
    });

    for (const res of currentEnrollments) {
        if (res.section.courseId === section.courseId) throw new ConflictException('Already enrolled in this course.');
        for (const s1 of section.schedules) {
            for (const s2 of res.section.schedules) {
                if (s1.dayOfWeek === s2.dayOfWeek && isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
                    throw new ConflictException(`Schedule conflict with ${res.section.course.courseCode}`);
                }
            }
        }
    }

    const limits = await this.getCreditLimits(studentId, section.academicYear, section.semester);
    const currentTotalCredits = currentEnrollments.reduce((sum, e) => sum + e.section.course.credits, 0);
    const isCoopEnrollment = section.course.category === CourseCategory.COOP_COURSE;
    
    if (!isCoopEnrollment && (currentTotalCredits + section.course.credits) > limits.max) {
        throw new BadRequestException(`ลงทะเบียนเกินขีดจำกัดหน่วยกิต (Max: ${limits.max})`);
    }

    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          sectionId,
          academicYear: section.academicYear,
          semester: section.semester,
          status: 'ENROLLED',
        },
      });

      await tx.section.update({
        where: { id: sectionId },
        data: { enrolledCount: { increment: 1 } },
      });

      return enrollment;
    });
  }

  async validateFinalStatus(studentId: string, academicYear: number, semester: number) {
    const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId, academicYear, semester },
        include: { section: { include: { course: true } } }
    });

    const totalCredits = enrollments.reduce((sum, e) => sum + e.section.course.credits, 0);
    const hasCoop = enrollments.some(e => e.section.course.category === CourseCategory.COOP_COURSE);
    const limits = await this.getCreditLimits(studentId, academicYear, semester);

    if (!hasCoop && totalCredits < limits.min) {
        return {
            valid: false,
            message: `จำนวนหน่วยกิตรวม (${totalCredits}) ต่ำกว่าขั้นต่ำที่กำหนด (${limits.min})`,
            totalCredits
        };
    }

    return { valid: true, totalCredits };
  }

  async drop(studentId: string, sectionId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_sectionId: { studentId, sectionId } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status === 'SUCCESS') throw new BadRequestException('Cannot drop a graded course');

    return this.prisma.$transaction(async (tx) => {
      await tx.enrollment.delete({ where: { id: enrollment.id } });
      await tx.section.update({
        where: { id: sectionId },
        data: { enrolledCount: { decrement: 1 } },
      });
      return { message: 'Dropped successfully' };
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: { section: { include: { course: true, schedules: true } } },
    });
  }

  async findByStudentAndTerm(studentId: string, yr: number, sem: number) {
    return this.prisma.enrollment.findMany({
      where: { studentId, academicYear: yr, semester: sem },
      include: { section: { include: { course: true, schedules: true } } },
    });
  }
}
