import { Module } from '@nestjs/common';
import { CurriculumCourseController } from './curriculum-course.controller';
import { CurriculumCourseService } from './curriculum-course.service';

@Module({
  controllers: [CurriculumCourseController],
  providers: [CurriculumCourseService]
})
export class CurriculumCourseModule {}
