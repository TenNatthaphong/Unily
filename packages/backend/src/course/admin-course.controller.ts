import { Controller, Post, Body, Patch, Delete, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditInterceptor } from '../common/interceptor/audit.interceptor';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
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
