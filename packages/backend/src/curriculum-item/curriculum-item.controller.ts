import { Controller, Get, Query } from '@nestjs/common';
import { CurriculumItemService } from './curriculum-item.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';

@Controller('curriculum-items')
export class CurriculumItemController {
  constructor(private readonly itemService: CurriculumItemService) {}

  @Get()
  findById(@Query('code') code: string) {
    return this.itemService.findById(code);
  } 
}