import { Module } from '@nestjs/common';
import { CurriculumItemController } from './curriculum-item.controller';
import { CurriculumItemService } from './curriculum-item.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CurriculumItemController],
  providers: [CurriculumItemService]
})
export class CurriculumItemModule {}
