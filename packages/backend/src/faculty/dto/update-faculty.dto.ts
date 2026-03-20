import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateFacultyDto{

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '04'})
  facultyCode?: string;
  
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'คณะวิทยาศาสตร์ประยุกต์'})
  nameTh?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Faculty of Applied Science'})
  nameEn?: string;
}