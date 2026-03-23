import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }

  // ===========================================================================
  // SEARCH & FILTER
  // ===========================================================================

  async findByFaculty(facultyId: string) {
    return this.prisma.department.findMany({
      where: { facultyId },
      orderBy: { deptCode: 'asc' }
    });
  }
}