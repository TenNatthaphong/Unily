import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { AdminSectionController } from './admin-section.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [SectionService],
  imports: [PrismaModule],
  controllers: [SectionController, AdminSectionController]
})
export class SectionModule {}
