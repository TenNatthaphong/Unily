import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import csvParser = require('csv-parser');
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // PROFILE ACTIONS
  // ===========================================================================

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: { include: { curriculum: true, department: true, faculty: true } },
        professorProfile: { include: { department: true, faculty: true } },
        adminProfile: true
      }
    });
  }

  async updateOwnProfile(id: string, data: UpdateUserDto) {
    const { role, status, ...safeData } = data; // Protect core fields
    return this.prisma.user.update({ where: { id }, data: safeData });
  }

  // ===========================================================================
  // ADMIN ACTIONS
  // ===========================================================================

  async findAll() {
    return this.prisma.user.findMany();
  }

  async suspendUser(adminId: string, targetId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN') throw new ForbiddenException('Cannot suspend an admin');

    return this.prisma.user.update({ where: { id: targetId }, data: { status: 'SUSPENDED' } });
  }

  async adminUpdateStudent(adminId: string, targetId: string, dto: any) {
    const { email, firstName, lastName, studentStatus } = dto;
    return this.prisma.user.update({
      where: { id: targetId },
      data: { email, firstName, lastName, studentProfile: { update: { status: studentStatus } } }
    });
  }

  async adminUpdateProfessor(adminId: string, targetId: string, dto: any) {
    const { email, firstName, lastName } = dto;
    return this.prisma.user.update({
      where: { id: targetId },
      data: { email, firstName, lastName }
    });
  }

  // ===========================================================================
  // BULK IMPORT (HIGH PERFORMANCE)
  // ===========================================================================

  async importUsersFromCsv(file: Express.Multer.File): Promise<any> {
    const results: any[] = [];
    const stream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.trim().replace(/^[\u200B-\uFEFF]/, ''),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (d) => results.push(d))
        .on('end', () => this.processImport(results).then(resolve).catch(reject))
        .on('error', (e) => reject(new BadRequestException(e.message)));
    });
  }

  private async processImport(rows: any[]) {
    const faculties = new Set((await this.prisma.faculty.findMany({ select: { id: true } })).map(f => f.id));
    const depts = new Set((await this.prisma.department.findMany({ select: { id: true } })).map(d => d.id));
    const existing = new Set((await this.prisma.user.findMany({ select: { email: true } })).map(u => u.email));
    
    const [users, students, professors, admins] = [[], [], [], []] as any[][];
    const incomingEmails = new Set<string>();

    rows.forEach((row, i) => {
      if (!row.email || !row.role) throw new Error(`Row ${i + 1}: Missing core info`);
      if (existing.has(row.email) || incomingEmails.has(row.email)) throw new Error(`Row ${i + 1}: Duplicate email ${row.email}`);
      
      incomingEmails.add(row.email);
      const uid = randomUUID();
      users.push({ id: uid, email: row.email, password: row.password, firstName: row.firstName, lastName: row.lastName, role: row.role as any });

      if (row.role === 'STUDENT') {
        if (!faculties.has(row.facultyId) || !depts.has(row.deptId)) throw new Error(`Row ${i + 1}: Invalid Fac/Dept ID`);
        students.push({ userId: uid, studentCode: row.studentCode, facultyId: row.facultyId, deptId: row.deptId, entryYear: +row.entryYear, year: +row.year || 1, gpax: +row.gpax || 0 });
      } else if (row.role === 'PROFESSOR') {
        professors.push({ userId: uid, facultyId: row.facultyId, deptId: row.deptId });
      } else if (row.role === 'ADMIN') {
        admins.push({ userId: uid });
      }
    });

    const BATCH = 1000;
    for (let i = 0; i < users.length; i += BATCH) {
      const uBatch = users.slice(i, i + BATCH);
      const ids = new Set(uBatch.map(u => u.id));
      
      await this.prisma.$transaction(async (tx) => {
        await tx.user.createMany({ data: uBatch });
        const s = students.filter(x => ids.has(x.userId));
        const p = professors.filter(x => ids.has(x.userId));
        const a = admins.filter(x => ids.has(x.userId));
        if (s.length) await tx.studentProfile.createMany({ data: s });
        if (p.length) await tx.professorProfile.createMany({ data: p });
        if (a.length) await tx.adminProfile.createMany({ data: a });
      }, { timeout: 30000 });
    }

    return { count: users.length };
  }
}
