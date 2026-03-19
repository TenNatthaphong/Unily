import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateCurriculumItemDto {
  @IsString()
  curriculumId: string;

  @IsString()
  courseId: string;

  @IsInt()
  @Min(1)
  @Max(8)
  semester: number;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsInt()
  @IsOptional()
  positionX?: number = 0;

  @IsInt()
  @IsOptional()
  positionY?: number = 0;
}