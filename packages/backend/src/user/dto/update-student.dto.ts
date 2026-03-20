import { UpdateUserDto } from "./update-user.dto";
import { IsInt, IsEnum, IsNumber, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { StudentStatus } from "@prisma/client";

export class UpdateStudentDto extends UpdateUserDto {

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ example: 1, description: "Year of the user" })
  year?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 0.0, description: "GPAX of the user" })
  gpax?: number;

  @IsOptional()
  @IsEnum(StudentStatus)
  @ApiPropertyOptional({
    example: "STUDYING",
    description: "Status of the user",
  })
  studentStatus?: StudentStatus;
}
