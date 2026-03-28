import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { ApiQuery, ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('curriculums')
@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get()
  @ApiOperation({ summary: 'List curriculums (supports pagination)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('facultyId') facultyId?: string,
    @Query('deptId') deptId?: string,
  ) {
    if (page || limit || search || facultyId || deptId) {
      return this.curriculumService.findAllPaginated({
        page: +(page || 1),
        limit: +(limit || 50),
        search,
        facultyId,
        deptId
      });
    }
    return this.curriculumService.findAll();
  }

  @Get('my/plan')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'View academic progress and future study plan' })
  getMyPlan(@Request() req: any) {
    return this.curriculumService.getMyCurriculumPlan(req.user.id);
  }

  @Get('student/:id/plan')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: View specific student progress' })
  getStudentPlan(@Param('id') id: string) {
    return this.curriculumService.getMyCurriculumPlan(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific curriculum' })
  findOne(@Param('id') id: string) {
    return this.curriculumService.findOne(id);
  }

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Import curriculum data from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.curriculumService.importFromCsv(file);
  }
}