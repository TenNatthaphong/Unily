import { Module } from '@nestjs/common';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module';
import { CurriculumItemModule } from './curriculum-item/curriculum-item.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [CourseModule, PrismaModule, CurriculumModule, CurriculumItemModule, AuditLogModule],
})
export class AppModule {}
