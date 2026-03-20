import { Module } from '@nestjs/common';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module';
import { CurriculumItemModule } from './curriculum-item/curriculum-item.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { EventModule } from './event/event.module';
import { SectionModule } from './section/section.module';
import { FacultyModule } from './faculty/faculty.module';
import { DepartmentModule } from './department/department.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    CourseModule, 
    PrismaModule, 
    CurriculumModule, 
    CurriculumItemModule, 
    EventModule, 
    SectionModule, 
    FacultyModule, 
    DepartmentModule, 
    UserModule,
  ],
})
export class AppModule {}
