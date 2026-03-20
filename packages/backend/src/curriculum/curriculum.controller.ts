// src/curriculum/curriculum.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Query } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @ApiQuery({ name: 'id', required: false, description: 'รหัสหลักสูตร', })
  @ApiQuery({ name: 'facultyId', required: false, description: 'รหัสคณะ', })
  @ApiQuery({ name: 'deptId', required: false, description: 'รหัสภาควิชา', })
  @Get()
  search(
    @Query('id') id?: string,
    @Query('facultyId') facultyId?: string,
    @Query('deptId') deptId?: string
  ) {
    return this.curriculumService.search(id,facultyId, deptId);
  }
  
}