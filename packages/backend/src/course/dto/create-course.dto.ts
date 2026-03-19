import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'CS101', description: 'รหัสวิชา' })
  id: string;

  @ApiProperty({ example: 'Introduction to Programming', description: 'ชื่อวิชา' })
  name: string;

  @ApiProperty({ example: 3, description: 'จำนวนหน่วยกิต' })
  credit: number;
}