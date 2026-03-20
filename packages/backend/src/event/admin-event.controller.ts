import { Body, Param, Post, Delete, Patch } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditInterceptor } from 'src/common/interceptor/audit.interceptor';
import { UseInterceptors } from '@nestjs/common';


@UseInterceptors(AuditInterceptor)
@Controller('admin/events')
export class AdminEventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างกิจกรรมใหม่' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขกิจกรรม' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบกิจกรรม' })
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
