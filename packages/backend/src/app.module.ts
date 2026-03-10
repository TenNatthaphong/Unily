import { Module } from '@nestjs/common';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { CurriculumCourseModule } from './curriculum-course/curriculum-course.module';

@Module({
  imports: [CourseModule, PrismaModule, CurriculumModule, CurriculumCourseModule],
})
export class AppModule {}
