import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCurriculumItemDto, CurriculumItemWithoutIdDto } from './dto/create-curriculum-item.dto';

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
}