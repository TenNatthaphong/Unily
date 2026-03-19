import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async getCourseManagementData(courseId: string) {
  const course = await this.prisma.course.findFirst({
  where: { 
    id: courseId,
    isWildcard: false  // หรือ isWildcard: false ตามชื่อฟิลด์จริงใน DB ของคุณ
  },
  include: {
    sections: {
      include: {
        schedules: true,
        professor: {
          select: {
            userId: true,
            deptId: true,
            facultyId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { sectionNo: 'asc' }
    }
  }
});

  if (!course) throw new NotFoundException('ไม่พบรายวิชานี้ในระบบ');
  
  const formattedSections = course.sections.map(section => ({
    id: section.id,
    sectionNo: section.sectionNo,
    capacity: section.capacity,
    enrolledCount: section._count.enrollments,
    isFull: section._count.enrollments >= section.capacity,
    // รวมชื่ออาจารย์ให้เสร็จจากหลังบ้าน
    professorName: section.professor?.user 
      ? `${section.professor.user.firstName} ${section.professor.user.lastName}`
      : 'ไม่มีผู้สอน',
    professorEmail: section.professor?.user?.email,
    // ส่งตารางเรียนไปด้วย
    schedules: section.schedules, 
  }));

  return {
    courseInfo: { 
      id: course.id,
      name: course.nameEn,
      credit: course.credits,
    },
    sections: formattedSections 
  };
  }
}
