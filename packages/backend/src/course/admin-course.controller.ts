import { Controller, Post, Body, Patch, Delete, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
// import { Roles } from 'src/auth/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptor/audit.interceptor';

// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN')
@UseInterceptors(AuditInterceptor)  
@Controller('admin/courses')
export class AdminCourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Patch()
  update(@Query('id') id: string,@Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id,updateCourseDto);
  }

  @Delete()
  delete(@Query('id') id: string) {
    return this.courseService.delete(id);
  }
}
