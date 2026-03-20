import { Role, UserStatus } from "@prisma/client";
import { IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {

  @IsString()
  @ApiProperty({ example: "u6604062630188@unily.ac.th", description: "Email of the user", })
  email: string;

  @IsString()
  @ApiProperty({ example: "password123", description: "Password of the user", })
  password: string;

  @IsString()
  @ApiProperty({ example: "John", description: "First name of the user", })
  firstName: string;

  @IsString()
  @ApiProperty({ example: "Doe", description: "Last name of the user", })
  lastName: string;

  @IsEnum(Role)
  @ApiProperty({ example: "STUDENT", description: "Role of the user", })
  role: Role;

  @IsEnum(UserStatus)
  @ApiProperty({ example: "ACTIVE", description: "Status of the user", })
  status: UserStatus;
}
