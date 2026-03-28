import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Action } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params } = request;

    let auditAction: Action | null = null;
    if (method === 'POST') auditAction = Action.CREATE;
    else if (['PATCH', 'PUT'].includes(method)) auditAction = Action.UPDATE;
    else if (method === 'DELETE') auditAction = Action.DELETE;

    if (!auditAction) return next.handle();

    const safeBody = body || {};
    const isCourse = url.includes('course');
    const isCurriculum = url.includes('curriculum');
    const isDept = url.includes('department') || url.includes('dept');
    const isFaculty = url.includes('faculty');
    const isSection = url.includes('section');

    const module = isCourse ? 'รายวิชา' 
                : isCurriculum ? 'หลักสูตร' 
                : isDept ? 'ภาควิชา'
                : isFaculty ? 'คณะ'
                : isSection ? 'กลุ่มเรียน (Section)' : 'ข้อมูลในระบบ';

    let itemName = safeBody.nameTh || safeBody.nameEn || safeBody.title || safeBody.courseCode || safeBody.name || safeBody.curriculumCode || '';

    if (!itemName && params?.id) {
      try {
        if (isCourse) {
          const c = await this.prisma.course.findUnique({ where: { id: params.id } });
          if (c) itemName = `${c.courseCode} ${c.nameTh}`;
        } else if (isCurriculum) {
          const c = await this.prisma.curriculum.findUnique({ where: { id: params.id } });
          if (c) itemName = c.name;
        } else if (isDept) {
          const d = await this.prisma.department.findUnique({ where: { id: params.id } });
          if (d) itemName = d.nameTh;
        } else if (isFaculty) {
          const f = await this.prisma.faculty.findUnique({ where: { id: params.id } });
          if (f) itemName = f.nameTh;
        } else if (isSection) {
          const s = await this.prisma.section.findUnique({ where: { id: params.id }, include: { course: true } });
          if (s) itemName = `ตอนเรียนที่ ${s.sectionNo} (${s.course.courseCode})`;
        }
      } catch (e) {}
    }

    if (!itemName) itemName = params?.id || 'Record';

    const fullTarget = `${module}: ${itemName}`.trim();

    return next.handle().pipe(
      tap(async () => {
        try {
          const adminId = user?.id || '41142b77-5b16-4932-a39b-099483aec4a0';
          let adminName = 'System Admin';
          
          if (user?.id) {
            const dbUser = await this.prisma.user.findUnique({
              where: { id: user.id },
              select: { firstName: true, lastName: true }
            });
            if (dbUser) adminName = `${dbUser.firstName} ${dbUser.lastName}`;
            else if (user.firstName && user.lastName) adminName = `${user.firstName} ${user.lastName}`;
          }

          await this.prisma.auditLog.create({
            data: {
              adminId,
              adminName,
              action: auditAction!,
              target: fullTarget,
            },
          });
          
          console.log(`✅ Audit Log recorded: ${fullTarget}`);
        } catch (error) {
          console.error('❌ AuditLog Processing Error:', error);
        }
      }),
    );
  }
}