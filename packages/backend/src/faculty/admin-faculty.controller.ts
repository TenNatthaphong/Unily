import { Body, Controller, Patch, Post, Delete, Query, UseInterceptors, UseGuards } from "@nestjs/common";
import { FacultyService } from "./faculty.service";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";
import { AuditInterceptor } from "../common/interceptor/audit.interceptor";
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)
@Controller('admin/faculty')
export class AdminFacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultyService.create(createFacultyDto);
  }

  @Patch()
  update(@Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultyService.update(updateFacultyDto);
  }

  @Delete()
  delete(@Query('facultyCode') facultyCode: string) {
    return this.facultyService.delete(facultyCode);
  }
}
