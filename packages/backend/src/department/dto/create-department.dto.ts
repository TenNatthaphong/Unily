import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "06", description: "รหัสภาควิชา" })
  deptCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "CS", description: "ชื่อย่อภาควิชา" })
  shortName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "วิทยาการคอมพิวเตอร์", description: "ชื่อวิชา (ไทย)" })
  nameTh: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "Computer Science", description: "Department Name (English)" })
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "04", description: "Faculty Course Code" })
  facultyCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "uuid", description: "Faculty ID" })
  facultyId: string;
}
