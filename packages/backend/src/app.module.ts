import { Module } from '@nestjs/common';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [CourseModule, PrismaModule],
})
export class AppModule {}
