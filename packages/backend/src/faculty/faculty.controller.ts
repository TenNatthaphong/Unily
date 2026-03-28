import { Controller, Get, Query } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { paginate } from '../common/utils/pagination.util';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    if (page || limit) {
      // Future-proofing for pagination, but for now faculty is usually a small list.
      // We still return a standardized structure if requested.
      const data = await this.facultyService.findAll();
      return paginate(data, data.length, +(page || 1), +(limit || 100));
    }
    return this.facultyService.findAll();
  }
}
