import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { ApiQuery, ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('curriculums')
@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'deptId', required: false })
  @Get()
  search(
    @Query('code') code?: string,
    @Query('facultyId') facultyId?: string,
    @Query('deptId') deptId?: string
  ) {
    return this.curriculumService.search(code, facultyId, deptId);
  }

  @Get('my/plan')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดูแผนการเรียนและความคืบหน้าของนักศึกษา' })
  getMyPlan(@Request() req: any) {
    return this.curriculumService.getMyCurriculumPlan(req.user.id);
  }
}