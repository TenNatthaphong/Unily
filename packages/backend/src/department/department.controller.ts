import { Controller, Get, Param } from '@nestjs/common';
import { DepartmentService } from './department.service';

@Controller('department')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    /** Lookup by facultyId (UUID) — used by frontend */
    @Get('by-faculty/:facultyId')
    findByFacultyId(@Param('facultyId') facultyId: string) {
        return this.departmentService.findByFacultyId(facultyId);
    }

    /** Legacy: lookup by facultyCode string */
    @Get('faculty/:facultyCode')
    findByFaculty(@Param('facultyCode') facultyCode: string) {
        return this.departmentService.findByFaculty(facultyCode);
    }
}
