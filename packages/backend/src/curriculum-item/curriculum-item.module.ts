import { Module } from '@nestjs/common';
import { CurriculumItemController } from './curriculum-item.controller';
import { CurriculumItemService } from './curriculum-item.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCurriculumItemController } from './admin-curriculum-item.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CurriculumItemController, AdminCurriculumItemController],
  providers: [CurriculumItemService]
})
export class CurriculumItemModule {}
