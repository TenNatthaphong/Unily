import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Action } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma:PrismaService){}
  
  async getRecentActivities() {
    return this.prisma.auditLog.findMany({
      take: 10, 
      orderBy: { createdAt: 'desc' },
      include: {
        admin: true
      }
    });
  }

  async createAuditLog(adminId: string, adminName: string, action: Action, target: string) {
    await this.prisma.auditLog.create({
      data: {
        adminId: adminId,
        adminName: adminName,
        action: action,
        target: target,
      }
    })
  }

}
