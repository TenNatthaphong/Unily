import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { AdminSectionController } from './admin-section.controller';
import { PrismaModule } from '../course/prisma/prisma.module';

@Module({
  providers: [SectionService],
  imports: [PrismaModule],
  controllers: [SectionController, AdminSectionController],
  exports: [SectionService]
})
export class SectionModule {}
