import { Controller, Post, Body, Patch, Delete, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
// import { Roles } from 'src/auth/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptor/audit.interceptor';

// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN')
@UseInterceptors(AuditInterceptor)  
@Controller('admin/curriculums')
export class AdminCurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  create(@Body() body: CreateCurriculumDto) { 
    return this.curriculumService.create(body);
  }

  @Patch()
  update(@Query('id') id: string,@Body() updateCurriculumDto: UpdateCurriculumDto) {
    return this.curriculumService.update(id,updateCurriculumDto);
  }

  @Delete()
  delete(@Query('id') id: string) {
    return this.curriculumService.delete(id);
  }
}
