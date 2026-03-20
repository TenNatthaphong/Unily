import { CreateUserDto } from "./create-user.dto";
import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProfessorDto extends CreateUserDto {
  @IsString()
  @ApiProperty({ example: "04", description: "Faculty ID of the user" })
  facultyId: string;

  @IsString()
  @ApiProperty({ example: "06", description: "Department ID of the user" })
  deptId: string;
}
