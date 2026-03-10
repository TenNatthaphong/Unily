import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';

@Injectable()
export class CurriculumItemService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCurriculumItemDto) {
    const existing = await this.prisma.curriculumCourse.findUnique({
      where: {
        curriculumId_courseId_semester: {
          curriculumId: dto.curriculumId,
          courseId: dto.courseId,
          semester: dto.semester,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('วิชานี้ถูกจัดวางในเทอมนี้แล้ว');
    }

    return this.prisma.curriculumCourse.create({
      data: {
        curriculumId: dto.curriculumId,
        courseId: dto.courseId,
        semester: dto.semester,
        year: dto.year,
        positionX: dto.positionX,
        positionY: dto.positionY,
      },
    });
  }

  async updatePosition(id: string, semester: number, x: number, y: number) {
    return this.prisma.curriculumCourse.update({
      where: { id },
      data: { semester, positionX: x, positionY: y }
    });
  }

  async remove(id: string) {
    return this.prisma.curriculumCourse.delete({ where: { id } });
  }
}