import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [AuditLogService],
  controllers: [AuditLogController],
  imports: [PrismaModule]
})
export class AuditLogModule {}
