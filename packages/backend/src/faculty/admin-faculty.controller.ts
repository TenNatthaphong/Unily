import { Body, Controller, Patch, Post, Delete, Query, UseInterceptors } from "@nestjs/common";
import { FacultyService } from "./faculty.service";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";
import { AuditInterceptor } from "src/common/interceptor/audit.interceptor";
// import { Auth } from "src/auth/decorators/auth.decorator";
// import { Role } from "src/auth/enums/role.enum";

// @Auth(Role.ADMIN)
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
