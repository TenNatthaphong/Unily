import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SectionService } from '../section/section.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('admin-stats')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly sectionService: SectionService) {}

  @Get('top-enrolled')
  @ApiOperation({ summary: '5 อันดับวิชาที่มีคนลงทะเบียนสูงสุด' })
  getTopEnrolled(@Query('academicYear') yr: string, @Query('semester') sem: string) {
    return this.sectionService.getTopEnrolledCourses(+yr, +sem);
  }

  @Get('failed-courses')
  @ApiOperation({ summary: '5 อันดับวิชาที่มีคนติด F สูงสุด' })
  getTopFailedCourses(@Query('academicYear') yr: string, @Query('semester') sem: string) {
    return this.sectionService.getTopFailedCourses(+yr, +sem);
  }
}
