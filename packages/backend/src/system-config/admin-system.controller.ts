import { Controller, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@ApiTags('admin-system')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/system')
export class AdminSystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('init-data')
  @ApiOperation({ summary: 'Initialize system data (Faculties, Depts, Courses, Curriculums)' })
  async initData() {
    const seedPath = path.join(process.cwd(), 'prisma');
    
    // Load JSONs
    const facDeptData = JSON.parse(fs.readFileSync(path.join(seedPath, 'facNdept.json'), 'utf-8')).faculties;
    const coursesData = JSON.parse(fs.readFileSync(path.join(seedPath, 'courses.json'), 'utf-8'));
    const curriculumData = JSON.parse(fs.readFileSync(path.join(seedPath, 'curriculum.json'), 'utf-8'));

    const facultyMap = new Map<string, string>();
    const deptMap = new Map<string, string>();
    const courseCodeToUuid = new Map<string, string>();

    // 1. Faculties & Depts
    for (const f of facDeptData) {
      const faculty = await this.prisma.faculty.upsert({
        where: { facultyCode: f.facultyCode },
        update: { nameTh: f.nameTh, nameEn: f.nameEn },
        create: { facultyCode: f.facultyCode, nameTh: f.nameTh, nameEn: f.nameEn }
      });
      facultyMap.set(f.facultyCode, faculty.id);

      for (const d of f.departments) {
        const dept = await this.prisma.department.upsert({
          where: { facultyId_deptCode: { facultyId: faculty.id, deptCode: d.deptCode } },
          update: { shortName: d.shortName, nameTh: d.nameTh, nameEn: d.nameEn, facultyCode: f.facultyCode },
          create: { 
            deptCode: d.deptCode, 
            facultyCode: f.facultyCode,
            shortName: d.shortName, 
            nameTh: d.nameTh, 
            nameEn: d.nameEn, 
            facultyId: faculty.id 
          }
        });
        deptMap.set(`${f.facultyCode}-${d.deptCode}`, dept.id);
      }
    }

    // 2. Courses
    for (const item of coursesData) {
      const fId = facultyMap.get(item.facultyId);
      const dId = deptMap.get(`${item.facultyId}-${item.deptId}`);
      if (!fId || !dId) continue;

      const course = await this.prisma.course.upsert({
        where: { courseCode: item.code },
        update: {
          nameTh: item.nameTh.split(/\s\d\(/)[0].trim(),
          nameEn: item.nameEn || '',
          credits: item.credits,
          lectureHours: item.lectureHours || 0,
          labHours: item.labHours || 0,
          selfStudyHours: item.selfStudyHours || 0,
          facultyId: fId,
          deptId: dId,
          category: item.category,
        },
        create: {
          courseCode: item.code,
          nameTh: item.nameTh.split(/\s\d\(/)[0].trim(),
          nameEn: item.nameEn || '',
          credits: item.credits,
          lectureHours: item.lectureHours || 0,
          labHours: item.labHours || 0,
          selfStudyHours: item.selfStudyHours || 0,
          facultyId: fId,
          deptId: dId,
          category: item.category,
        }
      });
      courseCodeToUuid.set(item.code, course.id);
    }

    // 3. Curriculums
    for (const curr of curriculumData) {
      const facultyId = facultyMap.get('04'); // default for seed
      const deptId = deptMap.get('04-06');
      if (!facultyId || !deptId) continue;

      await this.prisma.curriculum.upsert({
        where: { curriculumCode: curr.curriculumCode },
        update: { name: curr.name, year: curr.year, totalCredits: curr.totalCredits, facultyId, deptId },
        create: { curriculumCode: curr.curriculumCode, name: curr.name, year: curr.year, totalCredits: curr.totalCredits, facultyId, deptId }
      });
    }

    return { success: true, message: 'Data initialized successfully' };
  }
}
