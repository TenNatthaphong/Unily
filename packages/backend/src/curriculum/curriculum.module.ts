import { Module } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCurriculumController } from './admin-curriculum.controller';

@Module({
  imports: [PrismaModule],
  providers: [CurriculumService],
  controllers: [CurriculumController, AdminCurriculumController]
})
export class CurriculumModule {}
