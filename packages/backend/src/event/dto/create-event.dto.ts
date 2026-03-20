import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { EventCategory } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @IsString()
  @ApiProperty({ example: 'งานวันวิชาการ', description: 'ชื่อกิจกรรม' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'งานวันวิชาการ', description: 'รายละเอียดกิจกรรม' })
  description?: string;

  @IsDateString()
  @ApiProperty({ example: '2022-01-01T08:00:00.000Z', description: 'วันเริ่มต้นกิจกรรม' })
  startDate: string;

  @IsDateString()
  @ApiProperty({ example: '2022-01-02T17:00:00.000Z', description: 'วันสิ้นสุดกิจกรรม' })
  endDate: string;

  @IsEnum(EventCategory)
  @ApiProperty({ example: 'ACTIVITY', description: 'ประเภทกิจกรรม' })
  category: EventCategory;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'อาคารเรียนรวม', description: 'สถานที่จัดกิจกรรม' })
  location?: string;
}