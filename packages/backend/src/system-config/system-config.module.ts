import { Module } from '@nestjs/common';
import { SystemConfigController, AdminSemesterConfigController, AdminAuditLogController } from './system-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [PrismaModule, SectionModule],
  controllers: [SystemConfigController, AdminSemesterConfigController, AdminAuditLogController],
})
export class SystemConfigModule {}
