import { Module } from '@nestjs/common';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module'; 
import { CurriculumModule } from './curriculum/curriculum.module';
import { CurriculumItemModule } from './curriculum-item/curriculum-item.module';
import { SectionModule } from './section/section.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AcademicRecordModule } from './academic-record/academic-record.module';
import { EventModule } from './event/event.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { FacultyModule } from './faculty/faculty.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    CourseModule,
    PrismaModule,
    CurriculumModule,
    CurriculumItemModule,
    SectionModule,
    UserModule,
    AuthModule,
    EnrollmentModule,
    AcademicRecordModule,
    EventModule,
    SystemConfigModule,
    FacultyModule,
    DepartmentModule,
  ],
})
export class AppModule {}
