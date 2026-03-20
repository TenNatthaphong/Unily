import { Controller, Get, Param, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';

@Controller('department')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    @Get('faculty/:facultyCode')
    findByFaculty(@Param('facultyCode') facultyCode: string) {
        return this.departmentService.findByFaculty(facultyCode);
    }
}
