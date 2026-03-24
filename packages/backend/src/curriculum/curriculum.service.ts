import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { Grade } from '@prisma/client';
import csvParser = require('csv-parser');
import { Readable } from 'stream';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  async create(dto: CreateCurriculumDto) {
    const { items, ...data } = dto;
    return this.prisma.curriculum.create({
      data: { ...data, curriculumCourses: { create: items } },
      include: { curriculumCourses: true }
    });
  }

  async update(id: string, dto: UpdateCurriculumDto) {
    return this.prisma.curriculum.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.curriculum.delete({ where: { id } });
  }

  // ===========================================================================
  // SEARCH & FILTER
  // ===========================================================================

  async findAll() {
    return this.prisma.curriculum.findMany({
      include: { faculty: true, department: true, _count: { select: { curriculumCourses: true } } }
    });
  }

  async findOne(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: { 
        faculty: true, 
        department: true,
        curriculumCourses: { include: { course: true }, orderBy: [{ year: 'asc' }, { semester: 'asc' }] } 
      }
    });
    if (!curriculum) throw new NotFoundException('Curriculum not found');
    return curriculum;
  }

  // ===========================================================================
  // CSV IMPORT (HIGH PERFORMANCE)
  // ===========================================================================

  async importFromCsv(file: Express.Multer.File): Promise<any> {
    const results: any[] = [];
    const stream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({ 
          mapHeaders: ({ header }) => header.trim().replace(/^[\u200B-\uFEFF]/, ''),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (d) => results.push(d))
        .on('end', () => this.processImport(results).then(resolve).catch(reject))
        .on('error', (e) => reject(new BadRequestException(e.message)));
    });
  }

  private async processImport(rows: any[]) {
    const allFacs = await this.prisma.faculty.findMany();
    const allDepts = await this.prisma.department.findMany({ include: { faculty_id: true } });
    const allCourses = await this.prisma.course.findMany({ select: { id: true, courseCode: true } });
    
    const facMap = new Map(allFacs.map(f => [f.facultyCode, f.id]));
    const deptMap = new Map(allDepts.map(d => [`${d.faculty_id.facultyCode}-${d.deptCode}`, d.id]));
    const courseMap = new Map(allCourses.map(c => [c.courseCode, c.id]));

    let count = 0;
    const currs = new Map<string, any>();
    
    for (const row of rows) {
      if (!row.curriculumCode || !row.facultyCode || !row.deptCode) continue;
      
      if (!currs.has(row.curriculumCode)) {
        const fId = facMap.get(row.facultyCode);
        const dId = deptMap.get(`${row.facultyCode}-${row.deptCode}`);
        if (!fId || !dId) continue;

        const curr = await this.prisma.curriculum.upsert({
          where: { curriculumCode: row.curriculumCode },
          update: {},
          create: {
            curriculumCode: row.curriculumCode,
            name: row.curriculumNameTh || row.curriculumNameEn || row.curriculumCode,
            facultyId: fId,
            deptId: dId,
            year: +row.curriculumYear || new Date().getFullYear(),
            totalCredits: +row.totalCredits || 128
          }
        });
        currs.set(row.curriculumCode, curr);
        count++;
      }

      const curriculum = currs.get(row.curriculumCode);
      const cId = courseMap.get(row.courseCode);
      if (curriculum && cId) {
        await this.prisma.curriculumCourse.upsert({
          where: { curriculumId_courseId: { curriculumId: curriculum.id, courseId: cId } },
          update: { year: +row.year, semester: +row.semester },
          create: {
            curriculumId: curriculum.id,
            courseId: cId,
            year: +row.year,
            semester: +row.semester,
            positionX: 0,
            positionY: 0
          }
        });
      }
    }
    return { count };
  }

  // ===========================================================================
  // STUDENT SPECIFIC
  // ===========================================================================

  async getMyCurriculumPlan(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { 
        curriculum: { 
          include: { 
            curriculumCourses: {
              include: {
                course: {
                  include: { prerequisites: { include: { requiresCourse: true } } }
                }
              },
              orderBy: [{ year: 'asc' }, { semester: 'asc' }]
            }
          } 
        } 
      }
    });

    if (!student?.curriculum) return null;

    const fullRecords = await this.prisma.academicRecord.findMany({
      where: { studentId, grade: { not: Grade.F } },
      include: { course: true },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: { not: 'DROPPED' } },
      include: { section: { include: { course: true } } }
    });

    const passedCourseIds = new Set(fullRecords.map(r => r.courseId));
    const enrolledCourseIds = new Set(enrollments.map(e => e.section.courseId));
    const usedElectiveIds = new Set<string>();
    const usedEnrolledElectives = new Set<string>();

    const coreCourseIds = new Set(
      student.curriculum.curriculumCourses
        .filter(c => !c.course?.isWildcard && !c.mappingPattern)
        .map(c => c.courseId)
    );

    const plan = student.curriculum.curriculumCourses.map(cc => {
      if (!cc.course?.isWildcard && !cc.mappingPattern) {
        if (passedCourseIds.has(cc.courseId)) return { ...cc, status: 'COMPLETED' };
        if (enrolledCourseIds.has(cc.courseId)) return { ...cc, status: 'STUDYING' };
        return { ...cc, status: 'REMAINING' };
      }
      const pattern = cc.mappingPattern ? cc.mappingPattern.replace('%', '') : '';
      
      // Match passed
      const match = fullRecords.find(
        r => !coreCourseIds.has(r.courseId) && !usedElectiveIds.has(r.courseId) && 
             (pattern ? r.course.courseCode.startsWith(pattern) : r.course?.category === cc.course?.category)
      );
      if (match) {
        usedElectiveIds.add(match.courseId);
        return { ...cc, status: 'COMPLETED', matchedCourse: match.course };
      }

      // Match studying
      const studyingMatch = enrollments.find(
        e => !coreCourseIds.has(e.section.courseId) && !usedEnrolledElectives.has(e.section.courseId) && 
             (pattern ? e.section.course.courseCode.startsWith(pattern) : e.section.course?.category === cc.course?.category)
      );
      if (studyingMatch) {
        usedEnrolledElectives.add(studyingMatch.section.courseId);
        return { ...cc, status: 'STUDYING', matchedCourse: studyingMatch.section.course };
      }

      return { ...cc, status: 'REMAINING' };
    });

    return {
      curriculum: student.curriculum,
      plan,
      stats: {
        totalCredits: student.curriculum.totalCredits,
        creditsEarned: student.cs,
        gpax: student.gpax
      }
    };
  }
}