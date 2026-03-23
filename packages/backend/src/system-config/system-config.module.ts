import { Module } from '@nestjs/common';
import { SystemConfigController } from './system-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [PrismaModule, SectionModule],
  controllers: [SystemConfigController],
})
export class SystemConfigModule {}
