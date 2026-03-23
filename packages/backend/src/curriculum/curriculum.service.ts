import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { CreateCurriculumItemDto, CurriculumItemWithoutIdDto } from '../curriculum-item/dto/create-curriculum-item.dto';
@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCurriculumDto) {
    const { items, ...curriculumData } = dto;
    return this.prisma.curriculum.create({
      data: {
        ...curriculumData,
        curriculumCourses: {
          create: items,
        },
      },
      include: {
        curriculumCourses: true
      }
    });
  }

  async update(id: string, dto: UpdateCurriculumDto) {
    return this.prisma.curriculum.update({
      where: { id },
      data: dto
    });
  }

  async delete(id : string){
    return this.prisma.curriculum.delete({
      where: {
        id: id,
      },
    });
  }
  async search(code? : string,facultyId?: string, deptId?: string) {
    if(code){
      return this.prisma.curriculum.findMany({
        where: {
          curriculumCode: code,
        },
        include: {
          _count: { select: { curriculumCourses: true } }
        }
      });
    }
    if(facultyId && deptId){
      return this.prisma.curriculum.findMany({
        where: {
          facultyId: facultyId,
          deptId: deptId,
        },
        include: {
          _count: { select: { curriculumCourses: true } }
        }
      });
    }
    return this.prisma.curriculum.findMany({
      include: {
        _count: { select: { curriculumCourses: true } }
      }
    });
  }
}