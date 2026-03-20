import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({ data: dto });
  }

  async update(dto: UpdateFacultyDto) {
    return this.prisma.faculty.update({ where: { facultyCode: dto.facultyCode }, data: dto });
  }

  async delete(facultyCode: string) {
    return this.prisma.faculty.delete({ where: { facultyCode } });
  }

  async findAll() {
    return this.prisma.faculty.findMany({
      include: { _count: { select: { departments: true } } },
      orderBy: { facultyCode: 'asc' }
    });
  }
}