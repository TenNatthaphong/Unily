import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  // ===========================================================================
  // EVENT OPERATIONS
  // ===========================================================================

  async findAll() {
    return this.prisma.event.findMany({ orderBy: { startDate: 'asc' } });
  }

  async create(data: CreateEventDto) {
    return this.prisma.event.create({ data });
  }

  async update(id: string, data: UpdateEventDto) {
    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}