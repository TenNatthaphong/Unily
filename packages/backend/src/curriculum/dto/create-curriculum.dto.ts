import { IsString, IsInt, Min, Max, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { CurriculumStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CurriculumItemWithoutIdDto } from '../../curriculum-item/dto/create-curriculum-item.dto';

export class CreateCurriculumDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '04062566' })
  id?: string;

  @IsString()
  @ApiProperty({ example: 'CS-2567' })
  curriculumCode: string;

  @IsString()
  @ApiProperty({ example: 'วิทยาการคอมพิวเตอร์ 2567' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsInt()
  @Min(2500)
  @Max(2700)
  @ApiProperty({ example: 2567 })
  year: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 128 })
  totalCredits?: number;

  @IsString()
  @ApiProperty({ example: 'faculty-uuid' })
  facultyId: string;

  @IsString()
  @ApiProperty({ example: 'dept-uuid' })
  deptId: string;

  @IsOptional()
  @IsEnum(CurriculumStatus)
  @ApiPropertyOptional({ example: 'ACTIVE' })
  status?: CurriculumStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumItemWithoutIdDto)
  items?: CurriculumItemWithoutIdDto[];
}