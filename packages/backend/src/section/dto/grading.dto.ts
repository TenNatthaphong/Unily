import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Grade } from '@prisma/client';

export class GradeStudentDto {
  @IsString()
  @ApiProperty({ example: 'student-uuid' })
  studentId: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 40 })
  midtermScore?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 40 })
  finalScore?: number;

  @IsEnum(Grade)
  @IsOptional()
  @ApiPropertyOptional({ enum: Grade })
  grade?: Grade;
}

export class BulkGradeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeStudentDto)
  @ApiProperty({ type: [GradeStudentDto] })
  grades: GradeStudentDto[];
}
