import { Controller, Post, Body, Patch, Delete, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditInterceptor } from '../common/interceptor/audit.interceptor';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)  
@Controller('admin/curriculums')
export class AdminCurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  create(@Body() body: CreateCurriculumDto) { 
    return this.curriculumService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCurriculumDto: UpdateCurriculumDto) {
    return this.curriculumService.update(id, updateCurriculumDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.curriculumService.delete(id);
  }
}
