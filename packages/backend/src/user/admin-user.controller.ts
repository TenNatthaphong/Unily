import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
// import { Roles } from 'src/auth/roles.decorator';

@Controller('admin/users')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.findAllPaginated({
      page: +page,
      limit: +limit,
      role: role as any,
      search,
    });
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new ForbiddenException('No file uploaded');
    }
    return this.userService.importUsersFromCsv(file);
  }

  @Patch('student/:id')
  async updateStudent(@Param('id') id: string, @Body() updateDto: UpdateStudentDto, @Req() req: any) {
    const adminId = req.user ? req.user.id : 'unknown';
    return this.userService.adminUpdateStudent(adminId, id, updateDto);
  }

  @Patch('professor/:id')
  async updateProfessor(@Param('id') id: string, @Body() updateDto: UpdateProfessorDto, @Req() req: any) {
    const adminId = req.user ? req.user.id : 'unknown';
    return this.userService.adminUpdateProfessor(adminId, id, updateDto);
  }

  @Patch('admin/:id')
  async updateAdmin() {
    throw new ForbiddenException('แอดมินไม่สามารถแก้ไขข้อมูลแอดมินด้วยกันเองได้');
  }

  @Patch(':id/suspend')
  async suspendUser(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user ? req.user.id : 'unknown';
    return this.userService.suspendUser(adminId, id);
  }
}