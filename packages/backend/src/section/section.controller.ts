import { Controller, Get, Param, Query, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { SectionService } from './section.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BulkGradeDto } from './dto/grading.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('sections')
@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get()
  @ApiOperation({ summary: 'ดูรายการกลุ่มเรียนทั้งหมดในรายวิชานั้น' })
  findByCourse(@Query('courseId') courseId: string) {
    return this.sectionService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูรายละเอียดกลุ่มเรียนรายบุคคล' })
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }

  @Patch(':id/grades')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'อาจารย์กรอกคะแนนและเกรด' })
  updateGrades(
    @Param('id') id: string,
    @Body() bulkGradeDto: BulkGradeDto,
    @Request() req
  ) {
    return this.sectionService.updateGrades(id, req.user.userId, bulkGradeDto);
  }
}
