import { Controller, Post, Body, Patch, Delete } from '@nestjs/common';
import { CurriculumItemService } from './curriculum-course.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';

@Controller('curriculum-items')
export class CurriculumItemController {
  constructor(private readonly itemService: CurriculumItemService) {}

  @Post()
  create(@Body() dto: CreateCurriculumItemDto) {
    return this.itemService.create(dto);
  }

  @Patch()
  updatePosition(@Body() dto: { id: string; semester: number; x: number; y: number }) {
    return this.itemService.updatePosition(dto.id, dto.semester, dto.x, dto.y);
  }

  @Delete()
  remove(@Body() dto: { id: string }) {
    return this.itemService.remove(dto.id);
  }
}