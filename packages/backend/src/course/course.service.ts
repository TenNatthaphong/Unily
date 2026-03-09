import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

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
      where.AND.push({ id: { startsWith: combinedId } });
    }


    if (search) {
      where.AND.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { nameTh: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (prerequisite) {
      where.AND.push({
        prerequisites: {
          some: {
            preCourseId: prerequisite,
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
