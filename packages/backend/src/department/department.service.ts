import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  async update(deptId: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id:deptId }, data: dto });
  }

  async delete(deptId: string) {
    return this.prisma.department.delete({ where: { id:deptId } });
  }
  
async findByFaculty(facultyId: string) {
    return this.prisma.department.findMany({
      where: { facultyId },
      orderBy: { deptCode: 'asc' }
    });
  }


}