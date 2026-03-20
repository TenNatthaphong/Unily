import { IsString, IsInt, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CurriculumItemDto {

  @IsString()
  @ApiProperty({example: '04062566'})
  curriculumId: string;

  @IsString()
  @ApiProperty({example: '040613601'})
  courseId: string;

  @IsInt()
  @ApiProperty({example: 1})
  positionX: number;

  @IsInt()
  @ApiProperty({example: 1})
  positionY: number;

  @IsInt()
  @ApiProperty({example: 1, description: "Year of the course"})
  year: number;

  @IsInt()
  @ApiProperty({example: 1, description: "Semester of the course"})
  semester: number;
}

export class CurriculumItemWithoutIdDto extends OmitType(CurriculumItemDto, ['curriculumId'] as const) {}
export class CreateCurriculumItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumItemWithoutIdDto) // ใช้ Class ใหม่ที่เรา Omit ออกมา
  items: CurriculumItemWithoutIdDto[]; 
}