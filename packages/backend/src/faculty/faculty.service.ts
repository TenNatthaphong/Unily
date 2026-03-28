import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import csvParser = require('csv-parser');
import { Readable } from 'stream';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  async findAll() {
    return this.prisma.faculty.findMany({
      include: { _count: { select: { departments: true, curriculums: true } } },
      orderBy: { facultyCode: 'asc' }
    });
  }

  async findAllPaginated(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { nameTh: { contains: search, mode: 'insensitive' } },
        { facultyCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.faculty.findMany({
        where, skip, take: limit,
        include: { _count: { select: { departments: true } } },
        orderBy: { facultyCode: 'asc' },
      }),
      this.prisma.faculty.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({ data: dto });
  }

  async update(id: string, dto: UpdateFacultyDto) {
    // Note: UpdateFacultyDto has facultyCode, but we might want to update by ID
    return this.prisma.faculty.update({ where: { id }, data: dto });
  }

  async deleteByCode(facultyCode: string) {
    return this.prisma.faculty.delete({ where: { facultyCode } });
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

  private async asyncForEach(array: any[], callback: any) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  private async processImport(rows: any[]) {
    let facultyCount = 0;
    let deptCount = 0;

    await this.asyncForEach(rows, async (row) => {
      const facCode = row.facultyCode?.trim();
      const facNameTh = row.nameTh?.trim();
      const deptCode = row.deptCode?.trim();
      const deptNameTh = row.deptNameTh?.trim();

      if (!facCode || !facNameTh) return;

      const faculty = await this.prisma.faculty.upsert({
        where: { facultyCode: facCode },
        update: { nameTh: facNameTh, nameEn: row.nameEn?.trim() || facNameTh },
        create: { facultyCode: facCode, nameTh: facNameTh, nameEn: row.nameEn?.trim() || facNameTh }
      });
      facultyCount++;

      if (deptCode && deptNameTh) {
        await this.prisma.department.upsert({
          where: { facultyId_deptCode: { facultyId: faculty.id, deptCode } },
          update: { 
            nameTh: deptNameTh, 
            nameEn: row.deptNameEn?.trim() || deptNameTh, 
            shortName: row.deptShortName?.trim() || deptCode,
            facultyCode: facCode 
          },
          create: { 
            facultyId: faculty.id, 
            deptCode, 
            nameTh: deptNameTh, 
            nameEn: row.deptNameEn?.trim() || deptNameTh, 
            shortName: row.deptShortName?.trim() || deptCode,
            facultyCode: facCode
          }
        });
        deptCount++;
      }
    });

    return { facultyCount, deptCount };
  }
}