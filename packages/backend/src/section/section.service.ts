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

  // ===========================================================================
  // CONFLICT CHECKS
  // ===========================================================================

  async checkProfessorConflict(profId: string, yr: number, sem: number, schedules: any[], excludeId?: string) {
    const existing = await this.prisma.section.findMany({
      where: { professorId: profId, academicYear: yr, semester: sem, id: excludeId ? { not: excludeId } : undefined },
      include: { schedules: true }
    });

    schedules.forEach(ns => {
      existing.forEach(sec => {
        sec.schedules.forEach(es => {
          if (ns.dayOfWeek === es.dayOfWeek && isTimeOverlapping(ns.startTime, ns.endTime, es.startTime, es.endTime)) {
            throw new ConflictException(`Professor conflict on ${ns.dayOfWeek} (Section ${sec.sectionNo})`);
          }
        });
      });
    });
  }

  // ===========================================================================
  // SECTION CRUD
  // ===========================================================================

  async create(dto: CreateSectionDto) {
    await this.checkProfessorConflict(dto.professorId, dto.academicYear, dto.semester, dto.schedules);
    const { schedules, ...data } = dto;
    return this.prisma.section.create({ data: { ...data, schedules: { create: schedules } }, include: { schedules: true } });
  }

  async findByProfessor(profId: string, yr?: number, sem?: number) {
    return this.prisma.section.findMany({
      where: {
        professorId: profId,
        AND: [
          yr ? { academicYear: yr } : {},
          sem ? { semester: sem } : {},
        ]
      },
      include: {
        course: { include: { faculty: true, department: true } },
        schedules: true,
      }
    });
  }

  async findStudents(sectionId: string) {
    return this.prisma.enrollment.findMany({
      where: { sectionId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            department: true,
            faculty: true,
          }
        }
      }
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.section.findMany({
      where: { courseId },
      include: { course: true, schedules: true, professor: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });
  }

  async findAllAdmin(params: { page: number; limit: number; academicYear?: number; semester?: number; search?: string }) {
    const { page, limit, academicYear, semester, search } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;
    if (search) where.course = { courseCode: { contains: search, mode: 'insensitive' } };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.section.findMany({
        where, skip, take: limit,
        include: {
          course: { select: { courseCode: true, nameTh: true, credits: true } },
          professor: { include: { user: { select: { firstName: true, lastName: true } } } },
          schedules: true,
        },
        orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }, { sectionNo: 'asc' }],
      }),
      this.prisma.section.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const sec = await this.prisma.section.findUnique({
      where: { id },
      include: { course: true, schedules: true, professor: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });
    if (!sec) throw new NotFoundException('Section not found');
    return sec;
  }

  async update(id: string, dto: UpdateSectionDto) {
    const { schedules, ...data } = dto;
    const existing = await this.findOne(id);
    if (schedules || data.professorId) {
      await this.checkProfessorConflict(data.professorId || existing.professorId, data.academicYear || existing.academicYear, data.semester || existing.semester, schedules || existing.schedules, id);
    }
    return this.prisma.section.update({
      where: { id },
      data: { ...data, ...(schedules && { schedules: { deleteMany: {}, create: schedules } }) },
      include: { schedules: true }
    });
  }

  async remove(id: string) {
    return this.prisma.section.delete({ where: { id } });
  }

  // ===========================================================================
  // GRADING & SEMESTER CLOSING
  // ===========================================================================

  async updateGrades(id: string, profId: string, dto: BulkGradeDto) {
    const sec = await this.prisma.section.findUnique({ where: { id } });
    if (!sec || sec.professorId !== profId) throw new ForbiddenException('Unauthorized grading access');

    return Promise.all(dto.grades.map(async g => {
      const enr = await this.prisma.enrollment.findUnique({ where: { studentId_sectionId: { studentId: g.studentId, sectionId: id } } });
      if (!enr) return null;
      const mid = g.midtermScore ?? enr.midtermScore;
      const fin = g.finalScore ?? enr.finalScore;
      const total = mid + fin;
      return this.prisma.enrollment.update({
        where: { id: enr.id },
        data: { midtermScore: mid, finalScore: fin, totalScore: total, grade: g.grade || calculateGrade(total) }
      });
    }));
  }

  async closeSemester(yr: number, sem: number) {
    const config = await this.prisma.semesterConfig.findFirst({ where: { academicYear: yr, semester: sem } });
    if (!config || config.isCurrent) throw new BadRequestException('Cannot close current or non-existent semester');

    return this.prisma.$transaction(async (tx) => {
      const sections = await tx.section.findMany({ where: { academicYear: yr, semester: sem }, include: { enrollments: true, course: true } });
      const students = new Set<string>();

      for (const s of sections) {
        for (const e of s.enrollments) {
          if (!e.grade || e.status === 'DROPPED') continue;
          const gp = getGradePoint(e.grade);
          await tx.academicRecord.create({
            data: { studentId: e.studentId, courseId: s.courseId, academicYear: yr, semester: sem, grade: e.grade, ca: s.course.credits, cs: e.grade === 'F' ? 0 : s.course.credits, gp: gp * s.course.credits, gpa: gp }
          });
          students.add(e.studentId);
        }
        await tx.enrollment.updateMany({ where: { sectionId: s.id, grade: { not: null } }, data: { status: 'SUCCESS' } });
      }

      for (const sid of students) {
        const records = await tx.academicRecord.findMany({ where: { studentId: sid } });
        const { gpax, totalCA, totalCS } = calculateGPAX(records);
        const profile = await tx.studentProfile.findUnique({ where: { userId: sid }, include: { curriculum: true } });
        const target = profile?.curriculum?.totalCredits || 128;
        await tx.studentProfile.update({
          where: { userId: sid },
          data: { gpax, ca: totalCA, cs: totalCS, status: totalCS >= target ? StudentStatus.GRADUATED : StudentStatus.STUDYING }
        });
      }
      return { count: students.size };
    });
  }

  async advanceStudentYears() {
    const result = await this.prisma.studentProfile.updateMany({
      where: { status: 'STUDYING' },
      data: { year: { increment: 1 } }
    });
    return { count: result.count };
  }
}
