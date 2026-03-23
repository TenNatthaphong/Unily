import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { AdminFacultyController } from './admin-faculty.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [FacultyService],
  controllers: [FacultyController,AdminFacultyController],
  imports: [PrismaModule]
})
export class FacultyModule {}
