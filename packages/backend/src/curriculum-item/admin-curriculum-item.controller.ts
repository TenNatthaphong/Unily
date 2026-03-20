import { Controller, Put, Param, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurriculumItemService } from './curriculum-item.service';
import { CreateCurriculumItemDto } from './dto/create-curriculum-item.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
// import { Roles } from 'src/auth/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptor/audit.interceptor';

// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN')
@UseInterceptors(AuditInterceptor)  
@Controller('admin/curriculum-items')
export class AdminCurriculumItemController {
  constructor(private readonly itemService: CurriculumItemService) {}

  @Put(':id/flow')
  syncFlow(@Param('id') id: string, @Body() dto: CreateCurriculumItemDto) {
    return this.itemService.syncFlow(id, dto.items);
  }
}
