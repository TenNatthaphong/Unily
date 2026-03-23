import { IsString, IsInt, IsArray, IsEnum, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @IsEnum(DayOfWeek)
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MON })
  dayOfWeek: DayOfWeek;

  @IsString()
  @ApiProperty({ example: '09:00' })
  startTime: string;

  @IsString()
  @ApiProperty({ example: '12:00' })
  endTime: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'CB1201' })
  roomName?: string;
}

export class CreateSectionDto {
  @IsString()
  @ApiProperty({ example: 'course-uuid' })
  courseId: string;

  @IsInt()
  @ApiProperty({ example: 1 })
  sectionNo: number;

  @IsInt()
  @ApiProperty({ example: 50 })
  capacity: number;

  @IsInt()
  @IsOptional()
  @ApiProperty({ example: 0 })
  enrolledCount: number;

  @IsInt()
  @ApiProperty({ example: 1 })
  semester: number;

  @IsInt()
  @ApiProperty({ example: 2566 })
  academicYear: number;

  @IsString()
  @ApiProperty({ example: 'prof-uuid' })
  professorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  @ApiProperty({ type: [CreateScheduleDto] })
  schedules: CreateScheduleDto[];
}
