import { Controller, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { SectionService } from './section.service';
import { ApiTags } from '@nestjs/swagger';
import { AuditInterceptor } from 'src/common/interceptor/audit.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@ApiTags('admin-sections')
@UseInterceptors(AuditInterceptor)
@Controller('admin/sections')
export class AdminSectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionService.create(createSectionDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionService.update(id, updateSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionService.remove(id);
  }
}
