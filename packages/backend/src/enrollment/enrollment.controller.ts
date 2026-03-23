import { Controller, Post, Body, Get, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // ===========================================================================
  // STUDENT & ADMIN ACTIONS
  // ===========================================================================

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'ลงทะเบียนเรียน (เช็คตารางชน + prerequisite + Retake F)' })
  async create(@Body() dto: CreateEnrollmentDto, @Request() req) {
    // Force studentId to be the logged-in user if the role is STUDENT
    if (req.user.role === Role.STUDENT) {
      dto.studentId = req.user.userId;
    }
    return this.enrollmentService.create(dto);
  }

  @Delete('drop/:sectionId')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'ถอนรายวิชา (Drop)' })
  async drop(@Param('sectionId') sectionId: string, @Request() req, @Query('studentId') studentId?: string) {
    const targetId = req.user.role === Role.ADMIN ? (studentId || req.user.userId) : req.user.userId;
    return this.enrollmentService.drop(targetId, sectionId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดูรายวิชาที่ลงทะเบียนแล้วของตนเอง' })
  @ApiQuery({ name: 'academicYear', required: false, type: Number })
  @ApiQuery({ name: 'semester', required: false, type: Number })
  async getMyEnrollments(@Request() req, @Query('academicYear') yr?: string, @Query('semester') sem?: string) {
    return yr && sem 
      ? this.enrollmentService.findByStudentAndTerm(req.user.userId, +yr, +sem)
      : this.enrollmentService.findByStudent(req.user.userId);
  }

  // ===========================================================================
  // ADMIN & PROFESSOR ACTIONS
  // ===========================================================================

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดูรายวิชาที่ลงทะเบียนของนักศึกษา' })
  async findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentService.findByStudent(studentId);
  }
}
