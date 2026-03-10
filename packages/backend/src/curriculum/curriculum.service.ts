import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCurriculumDto) {
    return this.prisma.curriculum.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.curriculum.findMany({
      orderBy: { year: 'desc' },
      include: {
        _count: {
          select: { curriculumCourses: true } // ดูว่ามีวิชาถูกจัดลงแผนกี่วิชาแล้ว
        }
      }
    });
  }

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