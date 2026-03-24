import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurriculumItemWithoutIdDto } from './dto/create-curriculum-item.dto';

@Injectable()
export class CurriculumItemService {
  constructor(private prisma: PrismaService) {}

async syncFlow(curriculumId: string, items: CurriculumItemWithoutIdDto[]) {
  return this.prisma.$transaction(async (tx) => {
    await tx.curriculumCourse.deleteMany({
      where: { curriculumId }
    });
    const dataToInsert = items.map(item => ({
      ...item,  
      curriculumId
    }));

    await tx.curriculumCourse.createMany({
      data: dataToInsert
    });
      const updatedItems = await tx.curriculumCourse.findMany({
        where: { curriculumId },
        include: {
          course: true // แถมข้อมูลชื่อวิชา/หน่วยกิตไปด้วยเลย (ถ้าต้องการ)
        },
        orderBy: [
          { positionX: 'asc' },
          { positionY: 'asc' }
        ]
      });
      return updatedItems;
    });
    }

    async findById(code: string) {
      return this.prisma.curriculumCourse.findMany({
        where: { curriculum: { curriculumCode: code } },
        include: {
          course: {
            include: {
              prerequisites: { include: { requiresCourse: true } }
            }
          }
        },
        orderBy: [{ positionX: 'asc' }, { positionY: 'asc' }],
      });
    }
}