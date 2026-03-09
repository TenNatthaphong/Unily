import { Controller, Get, Query } from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('facultyId') facultyId?: string,
    @Query('deptId') deptId?: string,
    @Query('prerequisite') prerequisite?: string,
  ) {
    return this.courseService.findAll({
      page: Math.max(1, Number(page) || 1),
      limit: Math.max(1, Number(limit) || 10),
      search: search?.trim() || undefined,
      facultyId: facultyId?.trim() || undefined,
      deptId: deptId?.trim() || undefined,
      prerequisite: prerequisite?.trim() || undefined,
    });
  }

}
