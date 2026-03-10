import { IsString, IsInt, IsUUID } from 'class-validator';

export class CreateCurriculumItemDto {
  @IsUUID()
  curriculumId: string;

  @IsString()
  courseId: string; 

  @IsInt()
  semester: number; 

  @IsInt()
  year: number; 

  @IsInt()
  positionX: number;

  @IsInt()
  positionY: number;
}