import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import csvParser = require('csv-parser');
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Student and Professor (Own Profile Updates) ----

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  
  async updateOwnProfile(id: string, data: UpdateUserDto) {
    // Prevent updating root roles and status by omitting them
    const { role, status, ...safeData } = data;
    return this.prisma.user.update({ where: { id }, data: safeData });
  }

  // ---- Admin ----

  async findAll() {
    return this.prisma.user.findMany();
  }

  async create(data: any) {
    return this.prisma.user.create({ data });
  }

  // Admin suspends someone instead of deleting. Admin cannot suspend another admin
  async suspendUser(adminId: string, targetId: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetId } });
    
    if (!targetUser) throw new NotFoundException('ไม่พบผู้ใช้งาน');
    
    if (targetUser.role === 'ADMIN') {
      throw new ForbiddenException('แอดมินไม่สามารถระงับสิทธิ์แอดมินด้วยกันเองได้');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { status: 'SUSPENDED' },
    });
  }

  async adminUpdateStudent(adminId: string, targetStudentId: string, updateDto: any) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: targetStudentId },
        include: { studentProfile: true },
      });

      if (!user || user.role !== 'STUDENT') {
        throw new NotFoundException('ไม่พบข้อมูลนักศึกษา');
      }

      const { email, firstName, lastName, studentStatus } = updateDto;

      const updatedUser = await tx.user.update({
        where: { id: targetStudentId },
        data: {
          email,
          firstName,
          lastName,
          studentProfile: {
            update: studentStatus ? { status: studentStatus } : undefined,
          },
        },
        include: { studentProfile: true },
      });

      return updatedUser;
    });
  }

  async adminUpdateProfessor(adminId: string, targetProfId: string, updateDto: any) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetProfId } });

      if (!user || user.role !== 'PROFESSOR') {
        throw new NotFoundException('ไม่พบข้อมูลอาจารย์');
      }

      const { email, firstName, lastName } = updateDto;

      return tx.user.update({
        where: { id: targetProfId },
        data: { email, firstName, lastName },
      });
    });
  }

  // Import Users via CSV with chunk logic handling 40000+ records properly
  async importUsersFromCsv(file: Express.Multer.File): Promise<any> {
    const results: any[] = [];
    const stream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.trim().replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            const res = await this.processUserImportInBatches(results);
            resolve({ message: `นำเข้าผู้ใช้สำเร็จจำนวน ${res.count} คน` });
          } catch (error) {
            reject(new BadRequestException(error.message));
          }
        })
        .on('error', (error) => reject(new BadRequestException(`CSV Parsing error: ${error.message}`)));
    });
  }

  private async processUserImportInBatches(rows: any[]) {
    // 1. Validations Preparations Check FKs correctly
    const validFaculties = new Set((await this.prisma.faculty.findMany({ select: { id: true } })).map(f => f.id));
    const validDepts = new Set((await this.prisma.department.findMany({ select: { id: true } })).map(d => d.id));
    
    // Check for existing emails
    const existingUsers = await this.prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map(u => u.email));
    
    // Track incoming duplicates
    const incomingEmails = new Set<string>();
    const incomingStudentCodes = new Set<string>();
    
    const usersToInsert: any[] = [];
    const studentsToInsert: any[] = [];
    const professorsToInsert: any[] = [];
    const adminsToInsert: any[] = [];

    // 2. Validate row by row
    for (let index = 0; index < rows.length; index++) {
       const row = rows[index];
       if (!row.email || !row.firstName || !row.lastName || !row.role) {
         throw new Error(`แถวที่ ${index + 1}: ข้อมูลจำเป็นไม่ครบถ้วน (email=${row.email || 'ไม่มี'}, firstName=${row.firstName || 'ไม่มี'}, lastName=${row.lastName || 'ไม่มี'}, role=${row.role || 'ไม่มี'})`);
       }

       if (existingEmails.has(row.email) || incomingEmails.has(row.email)) {
         throw new Error(`แถวที่ ${index + 1}: Email ซ้ำซ้อน (${row.email})`);
       }
       incomingEmails.add(row.email);

       const userId = randomUUID(); 
       
       usersToInsert.push({
         id: userId,
         email: row.email,
         password: row.password,
         firstName: row.firstName,
         lastName: row.lastName,
         role: row.role as any,
         status: 'ACTIVE'
       });

       if (row.role === 'STUDENT') {
          if (!row.studentCode || !row.facultyId || !row.deptId || !row.entryYear) {
             throw new Error(`แถวที่ ${index + 1}: ข้อมูลนักศึกษาไม่ครบถ้วน (studentCode, facultyId, deptId, entryYear)`);
          }
          if (!validFaculties.has(row.facultyId)) throw new Error(`แถวที่ ${index + 1}: facultyId ไม่ถูกต้อง หรือยังไม่ได้ถูกสร้าง (${row.facultyId})`);
          if (!validDepts.has(row.deptId)) throw new Error(`แถวที่ ${index + 1}: deptId ไม่ถูกต้อง (${row.deptId})`);
          
          if (incomingStudentCodes.has(row.studentCode)) {
              throw new Error(`แถวที่ ${index + 1}: รหัสนักศึกษาซ้ำซ้อน (${row.studentCode})`);
          }
          incomingStudentCodes.add(row.studentCode);

          studentsToInsert.push({
             userId,
             studentCode: row.studentCode,
             facultyId: row.facultyId,
             deptId: row.deptId,
             entryYear: parseInt(row.entryYear),
             year: parseInt(row.year || '1'),
             gpax: parseFloat(row.gpax || '0'),
             status: row.studentStatus || 'STUDYING'
          });
       } else if (row.role === 'PROFESSOR') {
          if (!row.facultyId || !row.deptId) {
             throw new Error(`แถวที่ ${index + 1}: ข้อมูลอาจารย์ไม่ครบถ้วน (facultyId, deptId)`);
          }
          if (!validFaculties.has(row.facultyId)) throw new Error(`แถวที่ ${index + 1}: facultyId ไม่ถูกต้อง (${row.facultyId})`);
          if (!validDepts.has(row.deptId)) throw new Error(`แถวที่ ${index + 1}: deptId ไม่ถูกต้อง (${row.deptId})`);
          
          professorsToInsert.push({
             userId,
             facultyId: row.facultyId,
             deptId: row.deptId
          });
       } else if (row.role === 'ADMIN') {
          adminsToInsert.push({ userId });
       }
    }

    // 3. Batch insert using Transaction
    // Limit per batch to optimize DB performance for 40,000-50,000 users
    const BATCH_SIZE = 2000; 
    
    for (let i = 0; i < usersToInsert.length; i += BATCH_SIZE) {
       const userBatch = usersToInsert.slice(i, i + BATCH_SIZE);
       
       const sBatch = studentsToInsert.filter(s => userBatch.some(u => u.id === s.userId));
       const pBatch = professorsToInsert.filter(p => userBatch.some(u => u.id === p.userId));
       const aBatch = adminsToInsert.filter(a => userBatch.some(u => u.id === a.userId));

       await this.prisma.$transaction(async (tx) => {
         await tx.user.createMany({ data: userBatch });
         if (sBatch.length > 0) await tx.studentProfile.createMany({ data: sBatch });
         if (pBatch.length > 0) await tx.professorProfile.createMany({ data: pBatch });
         if (aBatch.length > 0) await tx.adminProfile.createMany({ data: aBatch });
       }, {
         maxWait: 10000, // 10 seconds max wait to connect to prisma
         timeout: 60000, // 60 seconds max execution time for 2000 rows
       });
    }

    return { count: usersToInsert.length };
  }
}
