import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { BulkGradeDto } from './dto/grading.dto';
import { Grade, StudentStatus } from '@prisma/client';
import { isTimeOverlapping } from '../common/utils/time.util';
import { calculateGrade, getGradePoint, calculateGPAX } from '../common/utils/grade.util';
import csvParser = require('csv-parser');
import { Readable } from 'stream';
import { paginate } from '../common/utils/pagination.util';

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

  async findByCourse(courseId: string, yr?: number, sem?: number) {
    return this.prisma.section.findMany({
      where: { 
        courseId,
        ...(yr && { academicYear: yr }),
        ...(sem && { semester: sem })
      },
      include: {
        course: true,
        schedules: true,
        professor: { include: { user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { sectionNo: 'desc' },
    });
  }

  async findAllAdmin(params: { page: number; limit: number; academicYear?: number; semester?: number; search?: string; dayOfWeek?: string; sortBy?: string; sortDir?: string }) {
    const { page, limit, academicYear, semester, search, dayOfWeek, sortBy, sortDir = 'asc' } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;
    if (search) where.course = { courseCode: { contains: search, mode: 'insensitive' } };
    if (dayOfWeek && dayOfWeek !== 'ALL') {
      where.schedules = { some: { dayOfWeek } };
    }

    if (sortBy === 'TIME') {
      const allSections = await this.prisma.section.findMany({
        where,
        include: {
          course: { select: { courseCode: true, nameTh: true, credits: true, nameEn: true } },
          professor: { include: { user: { select: { firstName: true, lastName: true } } } },
          schedules: true,
        }
      });

      const ascOrder: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7 };
      const descOrder: Record<string, number> = { FRI: 1, THU: 2, WED: 3, TUE: 4, MON: 5, SAT: 6, SUN: 7 };
      
      const sorted = allSections.sort((a, b) => {
        const s1 = a.schedules?.[0];
        const s2 = b.schedules?.[0];
        if (!s1 || !s2) return 0;
        
        const o1 = sortDir === 'desc' ? (descOrder[s1.dayOfWeek] || 99) : (ascOrder[s1.dayOfWeek] || 99);
        const o2 = sortDir === 'desc' ? (descOrder[s2.dayOfWeek] || 99) : (ascOrder[s2.dayOfWeek] || 99);
        
        if (o1 !== o2) return o1 - o2; 
        
        const t1 = s1.startTime;
        const t2 = s2.startTime;
        return sortDir === 'desc' ? t2.localeCompare(t1) : t1.localeCompare(t2);
      });

      return paginate(sorted.slice(skip, skip + limit), sorted.length, page, limit);
    }

    const orderBy: any[] = [];
    if (sortBy === 'MOST_ENROLLED') {
      orderBy.push({ enrolledCount: sortDir === 'desc' ? 'desc' : 'asc' });
    } else {
      orderBy.push({ academicYear: 'desc' }, { semester: 'asc' }, { sectionNo: 'asc' });
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.section.findMany({
        where, skip, take: limit,
        include: {
          course: { select: { courseCode: true, nameTh: true, credits: true, nameEn: true } },
          professor: { include: { user: { select: { firstName: true, lastName: true } } } },
          schedules: true,
        },
        orderBy,
      }),
      this.prisma.section.count({ where }),
    ]);
    return paginate(data, total, page, limit);
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
      const mid = g.midtermScore ?? enr.midtermScore ?? 0;
      const fin = g.finalScore ?? enr.finalScore ?? 0;
      const total = mid + fin;
      return this.prisma.enrollment.update({
        where: { id: enr.id },
        data: { midtermScore: mid, finalScore: fin, totalScore: total, grade: g.grade ?? calculateGrade(total) }
      });
    }));
  }

  async closeSemester(yr: number, sem: number) {
    const config = await this.prisma.semesterConfig.findFirst({ where: { academicYear: yr, semester: sem } });
    if (!config) throw new BadRequestException('Semester configuration not found');

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

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  async getTopEnrolledCourses(yr: number, sem: number) {
    // RAW QUERY to group by courseId across sections
    const results: any[] = await this.prisma.$queryRaw`
      SELECT c."courseCode", c."nameTh", COUNT(e.id)::int as "enrollCount"
      FROM "Enrollment" e
      JOIN "Section" s ON e."sectionId" = s.id
      JOIN "Course" c ON s."courseId" = c.id
      WHERE s."academicYear" = ${yr} AND s.semester = ${sem} 
        AND e.status IN ('ENROLLED', 'SUCCESS')
      GROUP BY c."courseCode", c."nameTh"
      ORDER BY "enrollCount" DESC
      LIMIT 5
    `;
    return results;
  }

  async getTopFailedCourses(yr: number, sem: number) {
    const groups = await this.prisma.academicRecord.groupBy({
      by: ['courseId'],
      where: { academicYear: yr, semester: sem, grade: 'F' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const results = await Promise.all(groups.map(async g => {
      const course = await this.prisma.course.findUnique({ where: { id: g.courseId } });
      if (!course) return null;
      return {
        courseCode: course.courseCode,
        nameTh: course.nameTh,
        failCount: g._count.id
      };
    }));

    return results.filter((r): r is { courseCode: string; nameTh: string; failCount: number } => r !== null);
  }

  // ===========================================================================
  // CSV IMPORT
  // ===========================================================================

  async importSectionsFromCsv(file: Express.Multer.File): Promise<any> {
    const results: any[] = [];
    const stream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({ 
          mapHeaders: ({ header }) => header.trim().replace(/^[\u200B-\uFEFF]/, ''),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (d) => results.push(d))
        .on('end', () => this.processSectionImport(results).then(resolve).catch(reject))
        .on('error', (e) => reject(new BadRequestException(e.message)));
    });
  }

  private async processSectionImport(rows: any[]) {
    const allCourses = await this.prisma.course.findMany();
    const allProfs = await this.prisma.user.findMany({ where: { role: 'PROFESSOR' } });
    
    const courseMap = new Map(allCourses.map(c => [c.courseCode, c.id]));
    const profMap = new Map(allProfs.map(u => [u.email, u.id]));

    let count = 0;
    for (const row of rows) {
      const cId = courseMap.get(row.courseCode);
      const pId = profMap.get(row.professorEmail);
      if (!cId || !pId) continue;

      const schedules = row.schedules?.split(';').map(s => {
        const [day, start, end] = s.split('|');
        return { dayOfWeek: day as any, startTime: start, endTime: end };
      }).filter(s => s.dayOfWeek) || [];

      await this.prisma.section.create({
        data: {
          courseId: cId,
          professorId: pId,
          sectionNo: +row.sectionNo,
          capacity: +row.capacity,
          academicYear: +row.academicYear,
          semester: +row.semester,
          schedules: { create: schedules }
        }
      });
      count++;
    }
    return { count };
  }
}
