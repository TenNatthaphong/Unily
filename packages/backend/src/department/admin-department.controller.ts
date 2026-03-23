import { Controller, Post, Body, Patch, Delete, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AuditInterceptor } from '../common/interceptor/audit.interceptor';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)
@Controller('admin/department')
export class AdminDepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    @Post()
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentService.create(createDepartmentDto);
    }

    @Patch()
    update(@Query('deptId') deptId: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentService.update(deptId, updateDepartmentDto);
    }

    @Delete()
    delete(@Query('deptId') deptId: string) {
        return this.departmentService.delete(deptId);
    }
}
