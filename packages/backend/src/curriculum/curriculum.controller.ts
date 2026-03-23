// src/curriculum/curriculum.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Query } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @ApiQuery({ name: 'code', required: false, description: 'รหัสหลักสูตร', })
  @ApiQuery({ name: 'facultyId', required: false, description: 'รหัสคณะ', })
  @ApiQuery({ name: 'deptId', required: false, description: 'รหัสภาควิชา', })
  @Get()
  search(
    @Query('code') code?: string,
    @Query('facultyId') facultyId?: string,
    @Query('deptId') deptId?: string
  ) {
    return this.curriculumService.search(code,facultyId, deptId);
  }
  
}