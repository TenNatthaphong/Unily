import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @IsString()
  @ApiProperty({ example: 'student-uuid' })
  studentId: string;

  @IsString()
  @ApiProperty({ example: 'section-uuid' })
  sectionId: string;
}
