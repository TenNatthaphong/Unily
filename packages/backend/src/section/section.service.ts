import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { BulkGradeDto } from './dto/grading.dto';
import { Grade, StudentStatus } from '@prisma/client';
import { isTimeOverlapping } from '../common/utils/time.util';
import { calculateGrade, getGradePoint, calculateGPAX } from '../common/utils/grade.util';

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  async checkProfessorConflict(professorId: string, academicYear: number, semester: number, newSchedules: any[], excludeSectionId?: string) {
    const existingSections = await this.prisma.section.findMany({
      where: {
        professorId, academicYear, semester,
        id: excludeSectionId ? { not: excludeSectionId } : undefined,
      },
      include: { schedules: true },
    });

    for (const newS of newSchedules) {
      for (const section of existingSections) {
        for (const existingS of section.schedules) {
          if (newS.dayOfWeek === existingS.dayOfWeek) {
            if (isTimeOverlapping(newS.startTime, newS.endTime, existingS.startTime, existingS.endTime)) {
              throw new ConflictException(
                `Professor has a time conflict on ${newS.dayOfWeek} at ${existingS.startTime}-${existingS.endTime} (Section ${section.sectionNo})`,
              );
            }
          }
        }
      }
    }
  }

  async create(createSectionDto: CreateSectionDto) {
    const { schedules, ...sectionData } = createSectionDto;
    await this.checkProfessorConflict(sectionData.professorId, sectionData.academicYear, sectionData.semester, schedules);
    return this.prisma.section.create({
      data: { ...sectionData, schedules: { create: schedules } },
      include: { schedules: true },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.section.findMany({
      where: { courseId },
      include: { course: true, schedules: true, professor: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async findOne(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { course: true, schedules: true, professor: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!section) throw new NotFoundException(`Section with ID "${id}" not found`);
    return section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto) {
    const { schedules, ...sectionData } = updateSectionDto;
    const existing = await this.findOne(id);
    if (schedules || sectionData.professorId || sectionData.academicYear || sectionData.semester) {
      await this.checkProfessorConflict(sectionData.professorId || existing.professorId, sectionData.academicYear || existing.academicYear, sectionData.semester || existing.semester, schedules || existing.schedules, id);
    }
    return this.prisma.section.update({
      where: { id },
      data: { ...sectionData, ...(schedules && { schedules: { deleteMany: {}, create: schedules } }) },
      include: { schedules: true },
    });
  }

  async remove(id: string) {
    return this.prisma.section.delete({ where: { id } });
  }

  async updateGrades(id: string, professorId: string, bulkGradeDto: BulkGradeDto) {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('Section not found');
    if (section.professorId !== professorId) throw new ForbiddenException('Only the instructor can grade this section');

    const results: any[] = [];
    for (const gradeInput of bulkGradeDto.grades) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_sectionId: { studentId: gradeInput.studentId, sectionId: id } },
      });
      if (!enrollment) continue;

      const mid = gradeInput.midtermScore ?? enrollment.midtermScore;
      const fin = gradeInput.finalScore ?? enrollment.finalScore;
      const total = mid + fin;
      const grade = gradeInput.grade || calculateGrade(total);

      const updated = await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { midtermScore: mid, finalScore: fin, totalScore: total, grade },
      });
      results.push(updated);
    }
    return results;
  }

  /**
   * ปิดเทอม (ต้อง isCurrent == false)
   */
  async closeSemester(academicYear: number, semester: number) {
    const semConfig = await this.prisma.semesterConfig.findFirst({
      where: { academicYear, semester },
    });
    if (!semConfig) throw new NotFoundException(`SemesterConfig not found`);
    if (semConfig.isCurrent) throw new BadRequestException('เทอมนี้ยังเป็น isCurrent = true อยู่ กรุณาเปลี่ยนเทอมก่อน');

    return this.prisma.$transaction(async (tx) => {
      const sections = await tx.section.findMany({
        where: { academicYear, semester },
        include: { enrollments: true, course: true },
      });

      const affectedStudentIds = new Set<string>();

      for (const section of sections) {
        for (const enrollment of section.enrollments) {
          if (!enrollment.grade) continue;

          const gradePoint = getGradePoint(enrollment.grade);
          const credits = section.course.credits;

          await tx.academicRecord.create({
            data: {
              studentId: enrollment.studentId,
              courseId: section.courseId,
              academicYear: section.academicYear,
              semester: section.semester,
              grade: enrollment.grade,
              ca: credits,
              cs: enrollment.grade === Grade.F ? 0 : credits,
              gp: gradePoint * credits,
              gpa: gradePoint,
            },
          });
          affectedStudentIds.add(enrollment.studentId);
        }
        await tx.enrollment.updateMany({
            where: { sectionId: section.id, grade: { not: null } },
            data: { status: 'SUCCESS' },
        });
      }

      // อัปเดต GPAX และ ตรวจสอบการจบการศึกษา (Graduation)
      for (const studentId of affectedStudentIds) {
        const records = await tx.academicRecord.findMany({ where: { studentId } });
        const { gpax, totalCA, totalCS } = calculateGPAX(records);

        // ดึงจำนวนวิชาที่กำหนดในหลักสูตร (สมมติเลขไว้ก่อน) 
        // ในระบบจริงควรดึงจาก curriculum.json
        const totalCreditsRequired = 130; 
        const status = (totalCS >= totalCreditsRequired) ? StudentStatus.GRADUATED : StudentStatus.STUDYING;

        await tx.studentProfile.update({
          where: { userId: studentId },
          data: { gpax, ca: totalCA, cs: totalCS, status },
        });
      }

      return { message: `ปิดเทอมสำเร็จ พบนักศึกษา ${affectedStudentIds.size} คนที่มีการอัปเดตผลการเรียน` };
    });
  }

  /**
   * ฟังก์ชันแถม: อัปเดตชั้นพีนึกศึกษา (Admin เป็นคนสั่ง)
   */
  async advanceStudentYears() {
     return this.prisma.studentProfile.updateMany({
        where: { status: StudentStatus.STUDYING },
        data: {
            year: { increment: 1 }
        }
     });
  }
}
