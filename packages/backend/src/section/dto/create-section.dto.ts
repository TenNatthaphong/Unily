import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {

  @IsString()
  @ApiProperty({example: '040613601'})
  courseId: string;

  @IsInt()
  @ApiProperty({example: 1})
  sectionNo: number;

  @IsInt()
  @ApiProperty({example: 50})
  capacity: number;

  @IsInt()
  @ApiProperty({example: 10})
  enrolledCount: number;

  @IsInt()
  @ApiProperty({example: 1})
  semester: number;

  @IsInt()
  @ApiProperty({example: 2566})
  academicYear: number;

  @IsString()
  @ApiProperty({example: '3acb4930-a929-475c-b336-e3d4801db16f'})
  professorId: string;
}
