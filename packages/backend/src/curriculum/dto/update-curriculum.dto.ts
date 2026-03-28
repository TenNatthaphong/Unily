import { IsString, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { CurriculumStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCurriculumDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'CS-2567' })
  curriculumCode?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'วิทยาการคอมพิวเตอร์ 2567' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(2500)
  @Max(2700)
  @ApiPropertyOptional({ example: 2567 })
  year?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 128 })
  totalCredits?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  facultyId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  deptId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description_note?: string;

  @IsOptional()
  @IsEnum(CurriculumStatus)
  @ApiPropertyOptional({ example: 'ACTIVE' })
  status?: CurriculumStatus;
}