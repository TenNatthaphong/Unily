import { Module } from '@nestjs/common';
import { SystemConfigController, AdminSemesterConfigController } from './system-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [PrismaModule, SectionModule],
  controllers: [SystemConfigController, AdminSemesterConfigController],
})
export class SystemConfigModule {}
