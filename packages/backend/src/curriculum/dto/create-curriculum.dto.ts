import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateCurriculumDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(2500)
  @Max(2600)
  year: number;

  @IsOptional()
  @IsString()
  description?: string;
}