import { Controller, Get, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CourseService } from './course.service';
import { ApiQuery, ApiOperation, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
  
  @Get()
  @ApiOperation({ summary: 'ค้นหารายวิชาพร้อม Pagination และ Filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'deptId', required: false })
  @ApiQuery({ name: 'prerequisite', required: false })
  @ApiQuery({ name: 'category', required: false })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '5',
    @Query('search') search?: string,
    @Query('facultyId') facultyId?: string,
    @Query('deptId') deptId?: string,
    @Query('prerequisite') prerequisite?: string,
    @Query('category') category?: string,
  ) {
    return this.courseService.findAll({
      page: +page,
      limit: +limit,
      search,
      facultyId,
      deptId,
      prerequisite,
      category,
    });
  }

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'นำเข้ารายวิชาจากไฟล์ CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.courseService.importCoursesFromCsv(file);
  }
}
