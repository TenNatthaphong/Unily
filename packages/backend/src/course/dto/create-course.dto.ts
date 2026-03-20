import { ApiProperty } from '@nestjs/swagger';
import { CourseCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsString, IsInt, IsOptional, IsArray } from 'class-validator';

export class CreateCourseDto {

  @IsString()
  @ApiProperty({ example: '04061234', description: 'รหัสวิชา' })
  courseCode: string;

  @IsString()
  @ApiProperty({ example: 'การเขียนโปรแกรมเบื้องต้น', description: 'ชื่อวิชา' })
  nameTh: string;

  @IsString()
  @ApiProperty({ example: 'Introduction to Programming', description: 'ชื่อวิชา' })
  nameEn: string;

  @IsInt()
  @ApiProperty({ example: 3, description: 'จำนวนหน่วยกิต' })
  credits: number;

  @IsEnum(CourseCategory)
  @ApiProperty({ enum: CourseCategory, description: 'ประเภทวิชา' })
  category: CourseCategory;

  @IsInt()
  @ApiProperty({ example: 99, description: 'ปีการศึกษาสูงสุด' })
  maxEntryYear: number;

  @IsInt()
  @ApiProperty({ example: 2, description: 'จำนวนชั่วโมงปฏิบัติการ' })
  labHours: number;

  @IsInt()
  @ApiProperty({ example: 2, description: 'จำนวนชั่วโมงบรรยาย' })
  lectureHours: number;

  @IsInt()
  @ApiProperty({ example: 3, description: 'จำนวนชั่วโมงศึกษาด้วยตนเอง' })
  selfStudyHours: number;

  @IsBoolean()
  @ApiProperty({ example: false, description: 'เป็นวิชาเลือก' })
  isWildcard: boolean;

  @IsString()
  @ApiProperty({ example: '04', description: 'รหัสภาควิชา' })
  deptId: string;

  @IsString()
  @ApiProperty({ example: '06', description: 'รหัสคณะ' })
  facultyId: string;

  @IsOptional()
  @IsArray()
  @ApiProperty({ example: ['04061111'], description: 'รหัสวิชาตัวก่อน', required: false })
  prerequisites?: string[];
}