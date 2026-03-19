import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Controller('audit-log')
export class AuditLogController {

  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('recent')
  async getRecentActivities() {
    return this.auditLogService.getRecentActivities();
  }

  @Post('create')
  async createAuditLog(@Body() dto:CreateAuditLogDto) {
    return this.auditLogService.createAuditLog(dto.adminId, dto.adminName, dto.action, dto.target);
  }
}
