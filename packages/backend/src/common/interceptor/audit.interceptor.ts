import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Action } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params } = request;

    return next.handle().pipe(
      tap(async () => {
  let auditAction: Action | null = null;
  if (method === 'POST') auditAction = Action.CREATE;
  else if (['PATCH', 'PUT'].includes(method)) auditAction = Action.UPDATE;
  else if (method === 'DELETE') auditAction = Action.DELETE;

      if (auditAction) {
        // audit.interceptor.ts

// ... ในส่วน tap(async () => { ...
      try {
        const mockUser = {
          id: '41142b77-5b16-4932-a39b-099483aec4a0',
          firstName: 'ad',
          lastName: 'min'
        };

        // 1. ป้องกัน body undefined ด้วยการใส่เครื่องหมาย ? 
        // หรือใช้โครงสร้าง (body || {}) เพื่อกันเหนี่ยว
        const safeBody = body || {};

        const isCourse = url.includes('course');
        const isCurriculum = url.includes('curriculum');
        const isCurriculumItem = url.includes('curriculum-item');
        const isEvent = url.includes('event');
        const isSection = url.includes('section');

        const module = isCourse ? 'รายวิชา' 
                    : isCurriculum ? 'หลักสูตร' 
                    : isCurriculumItem ? 'แผนการเรียน' 
                    : isEvent ? 'ปฏิทิน' 
                    : isSection ? 'กลุ่มเรียน (Section)' : 'ระบบ';
 
        const idFromUrl = url.split('?id=').pop();

        const itemName = safeBody.id ||
                        safeBody.nameTh || 
                        safeBody.nameEn || 
                        safeBody.title || 
                        params?.id ||
                        idFromUrl || 
                        'Unknown ID';

        const fullTarget = `${module}: ${itemName}`.trim();

        // สร้าง log
        await this.prisma.auditLog.create({
          data: {
            adminId: mockUser.id, 
            adminName: `${mockUser.firstName} ${mockUser.lastName}`,
            action: auditAction,
            target: fullTarget, 
          },
        });
        
        console.log(`✅ Audit Log recorded: ${fullTarget}`);
      } catch (error) {
        console.error('❌ AuditLog Error Details:', error);
      }
      }
    }),
    );
  }
}