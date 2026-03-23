import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { Grade } from '@prisma/client';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  async create(dto: CreateCurriculumDto) {
    const { items, ...data } = dto;
    return this.prisma.curriculum.create({
      data: { ...data, curriculumCourses: { create: items } },
      include: { curriculumCourses: true }
    });
  }

  async update(id: string, dto: UpdateCurriculumDto) {
    return this.prisma.curriculum.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.curriculum.delete({ where: { id } });
  }

  // ===========================================================================
  // SEARCH & FILTER
  // ===========================================================================

  async search(code?: string, facultyId?: string, deptId?: string) {
    const where: any = {};
    if (code) where.curriculumCode = code;
    if (facultyId && deptId) Object.assign(where, { facultyId, deptId });

    return this.prisma.curriculum.findMany({
      where,
      include: { _count: { select: { curriculumCourses: true } } }
    });
  }

  // ===========================================================================
  // STUDENT SPECIFIC
  // ===========================================================================

  async getMyCurriculumPlan(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { 
        curriculum: { 
          include: { 
            curriculumCourses: {
              include: { course: true },
              orderBy: [{ year: 'asc' }, { semester: 'asc' }]
            }
          } 
        } 
      }
    });

    if (!student?.curriculum) return null;

    const records = await this.prisma.academicRecord.findMany({
      where: { 
        studentId, 
        grade: { not: Grade.F } // Only exclude F for now as W doesn't exist in enum
      },
      select: { courseId: true }
    });

    const passedCourseIds = new Set(records.map(r => r.courseId));

    // Map through curriculum courses and mark status
    const plan = student.curriculum.curriculumCourses.map(cc => ({
      ...cc,
      status: passedCourseIds.has(cc.courseId) ? 'COMPLETED' : 'REMAINING'
    }));

    return {
      curriculum: student.curriculum,
      plan,
      stats: {
        totalCredits: student.curriculum.totalCredits,
        creditsEarned: student.cs,
        gpax: student.gpax
      }
    };
  }
}