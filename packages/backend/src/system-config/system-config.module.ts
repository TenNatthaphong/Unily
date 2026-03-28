import { Module } from '@nestjs/common';
import { SystemConfigController, AdminSemesterConfigController, AdminAuditLogController } from './system-config.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminSystemController } from './admin-system.controller';
import { SystemConfigModule as MainModule } from './system-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [PrismaModule, SectionModule],
  controllers: [SystemConfigController, AdminSemesterConfigController, AdminAuditLogController, AdminStatsController, AdminSystemController],
})
export class SystemConfigModule {}
