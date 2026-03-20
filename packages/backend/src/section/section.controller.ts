import { Controller, Get, Param, Query } from '@nestjs/common';
import { SectionService } from './section.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('sections')
@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get()
  @ApiOperation({ summary: 'ดูรายการกลุ่มเรียนทั้งหมดในรายวิชานั้น' })
  findByCourse(@Query('courseId') courseId: string) {
    return this.sectionService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูรายละเอียดกลุ่มเรียนรายบุคคล' })
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }
  
}
