import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseInterceptors, UseGuards, ParseIntPipe } from '@nestjs/common';
import { SectionService } from './section.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditInterceptor } from '../common/interceptor/audit.interceptor';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin-sections')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)
@Controller('admin/sections')
export class AdminSectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get()
  @ApiOperation({ summary: 'รายการกลุ่มเรียนทั้งหมด (paginated)' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
    @Query('search') search?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.sectionService.findAllAdmin({
      page: +page, limit: +limit,
      academicYear: academicYear ? +academicYear : undefined,
      semester: semester ? +semester : undefined,
      search,
      dayOfWeek,
      sortBy,
      sortDir,
    });
  }

  @Post()
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionService.create(createSectionDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionService.update(id, updateSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionService.remove(id);
  }

  @Post('close-semester')
  @ApiOperation({ summary: 'ปิดเทอม — ย้าย Enrollment → AcademicRecord + ทอน GPAX + Check Grad' })
  @ApiQuery({ name: 'academicYear', type: Number })
  @ApiQuery({ name: 'semester', type: Number })
  closeSemester(
    @Query('academicYear', ParseIntPipe) academicYear: number,
    @Query('semester', ParseIntPipe) semester: number,
  ) {
    return this.sectionService.closeSemester(academicYear, semester);
  }

  @Post('advance-student-years')
  @ApiOperation({ summary: 'อัปเดตชั้นปีนักศึกษาขึ้น 1 ปี (ใช้ตอนขึ้นปีการศึกษาใหม่เทอม 1)' })
  advanceYears() {
    return this.sectionService.advanceStudentYears();
  }
}
