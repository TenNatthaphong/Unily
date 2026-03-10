// src/curriculum/curriculum.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';

@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  create(@Body() createCurriculumDto: CreateCurriculumDto) {
    return this.curriculumService.create(createCurriculumDto);
  }

  @Get()
  findAll() {
    return this.curriculumService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.curriculumService.findOne(id);
  }
}