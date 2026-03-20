import { Controller, Get, Query } from '@nestjs/common';
import { CourseService } from './course.service';
import { ApiQuery } from '@nestjs/swagger';
// ชื่อกลุ่มในหน้า Swagger
@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService) {}
  
  @Get()
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'facultyId', required: false, type: String })
  @ApiQuery({ name: 'deptId', required: false, type: String })
  @ApiQuery({ name: 'prerequisite', required: false, type: String })
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
