import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // async create(dto: CreateCurriculumDto) {
  //   return this.prisma.curriculum.create({
  //     data: dto,
  //   });
  // }

  // async searchCurriculums(facultyId?: string, deptId?: string) {
  //   return this.prisma.curriculum.findMany({
  //     where: {
  //       facultyId: facultyId || undefined,
  //       deptId: deptId || undefined,
  //     },
  //     include: {
  //       faculty: { select: { name: true } },
  //       department: { select: { name: true } },
  //       _count: { select: { curriculumCourses: true } } // นับจำนวนวิชาในหลักสูตรนั้นๆ
  //     }
  //   });
  // }

  async findOne(id: string) {
    return this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        curriculumCourses: {
          include: { course: true } // ดึงวิชาที่จัดไว้แล้วออกมาด้วย
        }
      }
    });
  }
}