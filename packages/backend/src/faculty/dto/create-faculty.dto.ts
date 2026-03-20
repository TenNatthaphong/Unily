import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFacultyDto {
  
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '04'})
  facultyCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'คณะวิทยาศาสตร์ประยุกต์'})
  nameTh: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Faculty of Applied Science'})
  nameEn: string;
}