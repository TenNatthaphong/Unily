import { Controller, Post, Body, Get, Param, Delete, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
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

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'ลงทะเบียนเรียน (เช็คตารางชน + prerequisite + Retake F)' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.create(createEnrollmentDto);
  }

  @Delete('drop/:sectionId')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ถอนรายวิชา (Drop)' })
  drop(@Param('sectionId') sectionId: string, @Request() req) {
    return this.enrollmentService.drop(req.user.userId, sectionId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดูรายวิชาที่ลงทะเบียนแล้วของตนเอง' })
  @ApiQuery({ name: 'academicYear', required: false, type: Number })
  @ApiQuery({ name: 'semester', required: false, type: Number })
  getMyEnrollments(
    @Request() req,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    if (academicYear && semester) {
      return this.enrollmentService.findByStudentAndTerm(
        req.user.userId,
        parseInt(academicYear),
        parseInt(semester),
      );
    }
    return this.enrollmentService.findByStudent(req.user.userId);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดูรายวิชาที่ลงทะเบียนของนักศึกษา' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentService.findByStudent(studentId);
  }
}
