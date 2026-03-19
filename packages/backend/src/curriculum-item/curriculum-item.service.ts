import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';

@Injectable()
export class CurriculumItemService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCurriculumItemDto) {
    // กฎข้อที่ 1: ห้ามเพิ่มวิชาเดิมซ้ำในหลักสูตรเดียวกัน
    const existing = await this.prisma.curriculumCourse.findFirst({
      where: {
        curriculumId: dto.curriculumId,
        courseId: dto.courseId,
      },
    });

    if (existing) {
      throw new BadRequestException('วิชานี้ถูกเพิ่มลงในแผนการเรียนแล้ว');
    }

    // กฎข้อที่ 2: เช็คว่าวิชานั้นมีตัวตนจริงในฐานข้อมูลไหม
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new BadRequestException('ไม่พบรหัสวิชานี้ในระบบ');
    }

    // ถ้าผ่านหมด ให้บันทึกข้อมูล
    return this.prisma.curriculumCourse.create({
      data: {
        curriculumId: dto.curriculumId,
        courseId: dto.courseId,
        semester: dto.semester,
        year: dto.year || Math.ceil(dto.semester / 2),
        positionX: dto.positionX || 0,
        positionY: dto.positionY || 0,
      },
      include: { course: true }, // จอยข้อมูลวิชากลับไปให้ Frontend ด้วย
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