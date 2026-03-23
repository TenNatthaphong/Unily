import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SectionService } from '../section/section.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

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

  @Post('semester/close')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ปิดภาคเรียนและประมวลผลเกรดเฉลี่ยนิสิต' })
  async closeSemester(@Body() dto: { academicYear: number; semester: number }) {
    return this.sectionService.closeSemester(dto.academicYear, dto.semester);
  }
}
