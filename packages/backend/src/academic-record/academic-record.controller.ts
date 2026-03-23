import { Controller, Get, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AcademicRecordService } from './academic-record.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('academic-records')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('academic-records')
export class AcademicRecordController {
  constructor(private readonly academicRecordService: AcademicRecordService) {}

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดูผลการเรียนของตนเอง' })
  getMyRecords(@Request() req) {
    return this.academicRecordService.findByStudent(req.user.userId);
  }

  @Get('my/gpax')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดู GPAX สะสมของตนเอง' })
  getMyGPAX(@Request() req) {
    return this.academicRecordService.getGPAX(req.user.userId);
  }

  @Get('my/transcript')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดู Transcript รายเทอมของตนเอง' })
  getMyTranscript(@Request() req) {
    return this.academicRecordService.getTranscript(req.user.userId);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดูผลการเรียนของนักศึกษา' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.academicRecordService.findByStudent(studentId);
  }

  @Get('student/:studentId/gpax')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดู GPAX สะสมของนักศึกษา' })
  getStudentGPAX(@Param('studentId') studentId: string) {
    return this.academicRecordService.getGPAX(studentId);
  }

  @Get('student/:studentId/transcript')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดู Transcript ของนักศึกษา' })
  getStudentTranscript(@Param('studentId') studentId: string) {
    return this.academicRecordService.getTranscript(studentId);
  }

  @Get('student/:studentId/term')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'ดูผลการเรียนของเทอมที่ระบุ' })
  @ApiQuery({ name: 'academicYear', type: Number })
  @ApiQuery({ name: 'semester', type: Number })
  findByTerm(
    @Param('studentId') studentId: string,
    @Query('academicYear', ParseIntPipe) academicYear: number,
    @Query('semester', ParseIntPipe) semester: number,
  ) {
    return this.academicRecordService.findByStudentAndTerm(studentId, academicYear, semester);
  }
}
