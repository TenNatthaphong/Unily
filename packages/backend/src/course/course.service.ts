import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const { prerequisites, ...courseData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: courseData,
      });

      if (prerequisites && prerequisites.length > 0) {
        const prerequisiteData = prerequisites.map((preId) => ({
          courseId: course.id,
          requiresCourseId: preId,
        }));

        await tx.prerequisite.createMany({
          data: prerequisiteData,
        });
      }
      
      return tx.course.findUnique({
        where: { id: course.id },
        include: { prerequisites: true },
      });
    });
  }

  async update(id : string,dto : UpdateCourseDto){
    return this.prisma.course.update({
      where: {
        id: id,
      },
      data: dto,
    });
  }

  async delete(id : string){
    return this.prisma.course.delete({
      where: {
        id: id,
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    facultyId?: string;
    deptId?: string;
    prerequisite?: string;
  }) {
    const { page, limit, search, facultyId, deptId, prerequisite } = params;

    if (deptId && !facultyId) {
      throw new BadRequestException('Cannot provide deptId without facultyId');
    }

    const skip = (page - 1) * limit;

    const where: any = { AND: [] };

    let combinedId = '';

    if (facultyId) combinedId += facultyId;
    if (deptId) combinedId += deptId;

    if (combinedId) {
      where.AND.push({ courseCode: { startsWith: combinedId } });
    }

    if (search) {
      where.AND.push({
        OR: [
          { courseCode: { contains: search, mode: 'insensitive' } },
          { nameTh: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (prerequisite) {
      where.AND.push({
        prerequisites: {
          some: {
            requiresCourseId: prerequisite,
          },
        },
      });
    }

    if (where.AND.length === 0) delete where.AND;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: { id: 'asc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
    };
  }

}
