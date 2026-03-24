import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import csvParser = require('csv-parser');
import { Readable } from 'stream';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  async create(dto: CreateCourseDto) {
    const { prerequisites, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({ data });
      if (prerequisites?.length) {
        await tx.prerequisite.createMany({
          data: prerequisites.map(preId => ({ courseId: course.id, requiresCourseId: preId }))
        });
      }
      return tx.course.findUnique({ where: { id: course.id }, include: { prerequisites: true } });
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  // ===========================================================================
  // SEARCH & FILTER
  // ===========================================================================

  async findAll(params: { page: number; limit: number; search?: string; facultyId?: string; deptId?: string; prerequisite?: string; category?: string }) {
    const { page, limit, search, facultyId, deptId, prerequisite, category } = params;

    const where: any = { AND: [] };
    if (facultyId) where.AND.push({ facultyId });
    if (deptId) where.AND.push({ deptId });
    if (search) {
      where.AND.push({
        OR: [
          { courseCode: { contains: search, mode: 'insensitive' } },
          { nameTh: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
    if (prerequisite) where.AND.push({ prerequisites: { some: { requiresCourseId: prerequisite } } });
    if (category) where.AND.push({ category: category as any });
    if (!where.AND.length) delete where.AND;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({ 
        where, 
        take: limit, 
        skip: (page - 1) * limit, 
        orderBy: { courseCode: 'asc' },
        include: { prerequisites: { include: { requiresCourse: true } } }
      }),
      this.prisma.course.count({ where })
    ]);

    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  // ===========================================================================
  // CSV IMPORT
  // ===========================================================================

  async importCoursesFromCsv(file: Express.Multer.File): Promise<any> {
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
    const allFaculties = await this.prisma.faculty.findMany();
    const allDepts = await this.prisma.department.findMany({ include: { faculty_id: true } });
    
    const faculties = new Map(allFaculties.map(f => [f.facultyCode, f.id]));
    const depts = new Map(allDepts.map(d => [`${d.faculty_id.facultyCode}-${d.deptCode}`, d.id]));
    
    const courses: any[] = [];
    for (const row of rows) {
      if (!row.courseCode || !row.facultyCode || !row.deptCode) continue;
      
      const fId = faculties.get(row.facultyCode);
      const dId = depts.get(`${row.facultyCode}-${row.deptCode}`);
      if (!fId || !dId) continue;

      courses.push({
        courseCode: row.courseCode,
        nameTh: row.nameTh || '',
        nameEn: row.nameEn || '',
        credits: +row.credits || 0,
        lectureHours: +row.lectureHours || 0,
        labHours: +row.labHours || 0,
        selfStudyHours: +row.selfStudyHours || 0,
        facultyId: fId,
        deptId: dId,
        category: row.category as any
      });
    }

    const { count } = await this.prisma.course.createMany({ 
      data: courses, 
      skipDuplicates: true 
    });
    return { count };
  }
}
