import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { CourseCategory } from '@prisma/client';

export class UpdateCourseDto {
  
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'การเขียนโปรแกรมเบื้องต้น', description: 'ชื่อวิชา' })
  nameTh: string;
  
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Introduction to Programming', description: 'ชื่อวิชา' })
  nameEn: string;
  
  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 3, description: 'จำนวนหน่วยกิต' })
  credits: number;
  
  @IsOptional()
  @IsEnum(CourseCategory)
  @ApiProperty({ enum: CourseCategory, description: 'ประเภทวิชา' })
  category: CourseCategory;
  
  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 99, description: 'ปีการศึกษาสูงสุด' })
  maxEntryYear: number;
  
  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 2, description: 'จำนวนชั่วโมงปฏิบัติการ' })
  labHours: number;
  
  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 2, description: 'จำนวนชั่วโมงบรรยาย' })
  lectureHours: number;
  
  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 3, description: 'จำนวนชั่วโมงศึกษาด้วยตนเอง' })
  selfStudyHours: number;
  
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ example: false, description: 'เป็นวิชาเลือก' })
  isWildcard: boolean;
  
  @IsOptional()
  @IsString()
  @ApiProperty({ example: '04', description: 'รหัสภาควิชา' })
  deptId: string;
  
  @IsOptional()
  @IsString()
  @ApiProperty({ example: '06', description: 'รหัสคณะ' })
  facultyId: string;
  
  @IsOptional()
  @IsArray()
  @ApiProperty({ example: ['04061111'], description: 'รหัสวิชาตัวก่อน' })
  prerequisite?: string[];
}