import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

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

  async findAll(params: { page: number; limit: number; search?: string; facultyId?: string; deptId?: string; prerequisite?: string }) {
    const { page, limit, search, facultyId, deptId, prerequisite } = params;
    if (deptId && !facultyId) throw new BadRequestException('FacultyId required for DeptId');

    const where: any = { AND: [] };
    if (facultyId) where.AND.push({ courseCode: { startsWith: facultyId + (deptId || '') } });
    if (search) {
      where.AND.push({
        OR: [{ courseCode: { contains: search, mode: 'insensitive' } }, { nameTh: { contains: search, mode: 'insensitive' } }, { nameEn: { contains: search, mode: 'insensitive' } }]
      });
    }
    if (prerequisite) where.AND.push({ prerequisites: { some: { requiresCourseId: prerequisite } } });
    if (!where.AND.length) delete where.AND;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { courseCode: 'asc' } }),
      this.prisma.course.count({ where })
    ]);

    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }
}
