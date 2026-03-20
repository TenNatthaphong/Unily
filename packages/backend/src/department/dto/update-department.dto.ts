import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateDepartmentDto {

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "06", description: "รหัสภาควิชา" })
  departmentCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "CS", description: "ชื่อย่อภาควิชา" })
  shortName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "วิทยาการคอมพิวเตอร์", description: "ชื่อวิชา (ไทย)" })
  nameTh?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "Computer Science", description: "Department Name (English)" })
  nameEn?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "04", description: "Faculty Code" })
  facultyCode: string;
}
