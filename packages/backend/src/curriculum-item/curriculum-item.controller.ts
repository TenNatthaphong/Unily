import { Controller, Post, Body, Patch, Delete } from '@nestjs/common';
import { CurriculumItemService } from './curriculum-item.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';

@Controller('curriculum-items')
export class CurriculumItemController {
  constructor(private readonly itemService: CurriculumItemService) {}

}