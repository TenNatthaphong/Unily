import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSectionDto {

  @IsString()
  @IsOptional()
  @ApiProperty({example: '040613601'})
  courseId: string;

  @IsInt()
  @IsOptional()
  @ApiProperty({example: 1})
  sectionNo: number;

  @IsInt()
  @IsOptional()
  @ApiProperty({example: 50})
  capacity: number;

  @IsInt()
  @IsOptional()
  @ApiProperty({example: 10})
  enrolledCount: number;

  @IsInt()
  @IsOptional()
  @ApiProperty({example: 1})
  semester: number;

  @IsInt()
  @IsOptional()
  @ApiProperty({example: 2566})
  academicYear: number;

  @IsString()
  @IsOptional()
  @ApiProperty({example: '3acb4930-a929-475c-b336-e3d4801db16f'})
  professorId: string;
}
