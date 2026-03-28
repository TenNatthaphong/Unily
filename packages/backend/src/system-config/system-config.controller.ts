import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SectionService } from '../section/section.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { paginate } from '../common/utils/pagination.util';

@ApiTags('config')
@Controller('config')
export class SystemConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sectionService: SectionService
  ) {}

  @Get('semester/current')
  async getCurrent() {
    return this.prisma.semesterConfig.findFirst({
      where: { isCurrent: true },
      orderBy: { academicYear: 'desc' }
    });
  }

  /** Public endpoint — no auth required, used by students on the Schedule page */
  @Get('semesters')
  async getAllSemesters() {
    return this.prisma.semesterConfig.findMany({
      orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }]
    });
  }

  @Post('semester/close')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ปิดภาคเรียนและประมวลผลเกรดเฉลี่ยนิสิต' })
  async closeSemester(@Body() dto: { academicYear: number; semester: number }) {
    return this.sectionService.closeSemester(dto.academicYear, dto.semester);
  }
}

// ─── Admin Semester Config CRUD ───────────────────────────────────────────────
@ApiTags('admin-settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/settings/semester')
export class AdminSemesterConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all semester configs' })
  findAll() {
    return this.prisma.semesterConfig.findMany({
      orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }]
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a semester config' })
  async create(@Body() dto: {
    academicYear: number;
    semester: number;
    regStart: string;
    regEnd: string;
    withdrawStart: string;
    withdrawEnd: string;
    isCurrent?: boolean;
  }) {
    if (dto.isCurrent) {
      await this.prisma.semesterConfig.updateMany({ data: { isCurrent: false } });
    }
    return this.prisma.semesterConfig.create({ data: {
      ...dto,
      regStart: new Date(dto.regStart),
      regEnd: new Date(dto.regEnd),
      withdrawStart: new Date(dto.withdrawStart),
      withdrawEnd: new Date(dto.withdrawEnd),
    } });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a semester config' })
  async update(@Param('id') id: string, @Body() dto: Partial<{
    academicYear: number;
    semester: number;
    regStart: string;
    regEnd: string;
    withdrawStart: string;
    withdrawEnd: string;
    isCurrent: boolean;
  }>) {
    if (dto.isCurrent) {
      await this.prisma.semesterConfig.updateMany({ data: { isCurrent: false } });
    }
    const updateData: any = { ...dto };
    if (dto.regStart) updateData.regStart = new Date(dto.regStart);
    if (dto.regEnd) updateData.regEnd = new Date(dto.regEnd);
    if (dto.withdrawStart) updateData.withdrawStart = new Date(dto.withdrawStart);
    if (dto.withdrawEnd) updateData.withdrawEnd = new Date(dto.withdrawEnd);

    return this.prisma.semesterConfig.update({ where: { id }, data: updateData });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a semester config' })
  async delete(@Param('id') id: string) {
    return this.prisma.semesterConfig.delete({ where: { id } });
  }
}

// ─── Admin Audit Log ──────────────────────────────────────────────────────────
@ApiTags('admin-audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/audit-log')
export class AdminAuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with pagination' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '30',
    @Query('action') action?: string,
    @Query('adminName') adminName?: string,
  ) {
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (action) where.action = action;
    if (adminName) where.adminName = { contains: adminName, mode: 'insensitive' };

    return this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]).then(([data, total]) => paginate(data, total, +page, +limit));
  }
}
