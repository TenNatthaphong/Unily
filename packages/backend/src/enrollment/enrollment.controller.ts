import { Controller, Post, Body, Get, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('enrollment')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('search')
  @ApiOperation({ summary: 'ค้นหากลุ่มเรียนที่เปิดให้ลงทะเบียน' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'deptId', required: false })
  async search(@Query('q') q?: string, @Query('facultyId') fid?: string, @Query('deptId') did?: string) {
    return this.enrollmentService.searchSections({ q, facultyId: fid, deptId: did });
  }

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'ลงทะเบียนเรียน' })
  async create(@Body() dto: CreateEnrollmentDto, @Request() req) {
    return this.enrollmentService.create({ ...dto, studentId: req.user.id });
  }

  @Delete(':id')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'ถอนรายวิชา' })
  async drop(@Param('id') enrollmentId: string, @Request() req) {
    return this.enrollmentService.drop(req.user.id, enrollmentId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดูรายวิชาที่ลงทะเบียนแล้วของตนเอง' })
  @ApiQuery({ name: 'academicYear', required: false, type: Number })
  @ApiQuery({ name: 'semester', required: false, type: Number })
  async getMyEnrollments(@Request() req, @Query('academicYear') yr?: string, @Query('semester') sem?: string) {
    return yr && sem 
      ? this.enrollmentService.findByStudentAndTerm(req.user.id, +yr, +sem)
      : this.enrollmentService.findByStudent(req.user.id);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดูรายวิชาที่ลงทะเบียนของนักศึกษา' })
  async findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentService.findByStudent(studentId);
  }
}
