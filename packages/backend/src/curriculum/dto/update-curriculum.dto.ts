import { IsString, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { CurriculumStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCurriculumDto {

  @IsOptional()
  @IsString()
  @ApiProperty({example: 'วิทยาการคอมพิวเตอร์ 2566'})
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(2500)
  @Max(2600)
  @ApiProperty({example: 2566})
  year?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({example: '04'})
  facultyId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({example: '06'})
  deptId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({example: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ประจำปีการศึกษา 2566'})
  description?: string;

  @IsOptional()
  @IsEnum(CurriculumStatus)
  @ApiProperty({example: 'ACTIVE'})
  status?: CurriculumStatus;
}