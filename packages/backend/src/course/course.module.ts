import { Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCourseController } from './admin-course.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController, AdminCourseController],
  providers: [CourseService],
})
export class CourseModule {}
