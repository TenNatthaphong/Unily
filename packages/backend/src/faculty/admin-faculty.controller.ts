import { Body, Controller, Patch, Post, Delete, Query, UseInterceptors, UseGuards, UploadedFile, Param } from "@nestjs/common";
import { FacultyService } from "./faculty.service";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";
import { AuditInterceptor } from "../common/interceptor/audit.interceptor";
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('admin-faculty')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)
@Controller('admin/faculty')
export class AdminFacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  @ApiOperation({ summary: 'Create faculty' })
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultyService.create(createFacultyDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update faculty' })
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultyService.update(id, updateFacultyDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete faculty by code' })
  deleteByCode(@Query('facultyCode') facultyCode: string) {
    return this.facultyService.deleteByCode(facultyCode);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import faculties from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.facultyService.importFromCsv(file);
  }
}
