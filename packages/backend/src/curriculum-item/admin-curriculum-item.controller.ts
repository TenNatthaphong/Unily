import { Controller, Put, Param, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurriculumItemService } from './curriculum-item.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditInterceptor } from '../common/interceptor/audit.interceptor';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)  
@Controller('admin/curriculum-items')
export class AdminCurriculumItemController {
  constructor(private readonly itemService: CurriculumItemService) {}

  @Put(':id/flow')
  syncFlow(@Param('id') id: string, @Body() dto: CreateCurriculumItemDto) {
    return this.itemService.syncFlow(id, dto.items);
  }
}
