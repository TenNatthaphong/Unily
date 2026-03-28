import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import csvParser = require('csv-parser');
import { Readable } from 'stream';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  async create(dto: CreateDepartmentDto) {
    if (!dto.facultyCode && dto.facultyId) {
      const fac = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
      if (fac) dto.facultyCode = fac.facultyCode;
    } else if (!dto.facultyId && dto.facultyCode) {
      const fac = await this.prisma.faculty.findUnique({ where: { facultyCode: dto.facultyCode } });
      if (fac) dto.facultyId = fac.id;
    }
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    if (dto.facultyId && !dto.facultyCode) {
      const fac = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
      if (fac) dto.facultyCode = fac.facultyCode;
    } else if (dto.facultyCode && !dto.facultyId) {
      const fac = await this.prisma.faculty.findUnique({ where: { facultyCode: dto.facultyCode } });
      if (fac) dto.facultyId = fac.id;
    }
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }

  // ===========================================================================
  // SEARCH & FILTER
  // ===========================================================================

  /** Find departments by facultyId UUID (FK relationship) */
  async findByFacultyId(facultyId: string) {
    return this.prisma.department.findMany({
      where: { facultyId },
      include: { _count: { select: { curriculums: true } } },
      orderBy: { deptCode: 'asc' }
    });
  }

  /** Legacy: Find departments by facultyId/facultyCode (kept for backward compat) */
  async findByFaculty(facultyId: string) {
    return this.prisma.department.findMany({
      where: { facultyId },
      include: { _count: { select: { curriculums: true } } },
      orderBy: { deptCode: 'asc' }
    });
  }

  // ===========================================================================
  // CSV IMPORT
  // ===========================================================================

  async importFromCsv(file: Express.Multer.File): Promise<any> {
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
    const allFacs = await this.prisma.faculty.findMany();
    const facMap = new Map(allFacs.map(f => [f.facultyCode, f.id]));
    
    let count = 0;
    for (const row of rows) {
      if (!row.facultyCode || !row.deptCode || !row.nameTh) continue;
      const fId = facMap.get(row.facultyCode);
      if (!fId) continue;

      await this.prisma.department.upsert({
        where: { facultyId_deptCode: { facultyId: fId, deptCode: row.deptCode } },
        update: { nameTh: row.nameTh, nameEn: row.nameEn || row.nameTh, shortName: row.shortName || row.deptCode, facultyCode: row.facultyCode },
        create: { facultyId: fId, deptCode: row.deptCode, nameTh: row.nameTh, nameEn: row.nameEn || row.nameTh, shortName: row.shortName || row.deptCode, facultyCode: row.facultyCode }
      });
      count++;
    }
    return { count };
  }
}