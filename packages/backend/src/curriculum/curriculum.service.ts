import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

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

  async search(code?: string, facultyId?: string, deptId?: string) {
    const where: any = {};
    if (code) where.curriculumCode = code;
    if (facultyId && deptId) Object.assign(where, { facultyId, deptId });

    return this.prisma.curriculum.findMany({
      where,
      include: { _count: { select: { curriculumCourses: true } } }
    });
  }
}