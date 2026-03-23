import { Module } from '@nestjs/common';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module'; 
import { CurriculumModule } from './curriculum/curriculum.module';
import { SectionModule } from './section/section.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AcademicRecordModule } from './academic-record/academic-record.module';

@Module({
  imports: [
    CourseModule,
    PrismaModule,
    CurriculumModule,
    SectionModule,
    UserModule,
    AuthModule,
    EnrollmentModule,
    AcademicRecordModule,
  ],
})
export class AppModule {}
