import { UpdateUserDto } from "./update-user.dto";
import { IsString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProfessorDto extends UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "04", description: "Faculty ID of the user" })
  facultyId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "06", description: "Department ID of the user" })
  deptId?: string;
}
