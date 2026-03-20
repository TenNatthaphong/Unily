import { Role, UserStatus } from "@prisma/client";
import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: "u6604062630188@unily.ac.th",
    description: "Email of the user",
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: "password123",
    description: "Password of the user",
  })
  password?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "John", description: "First name of the user" })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Doe", description: "Last name of the user" })
  lastName?: string;

  @IsOptional()
  @IsEnum(Role)
  @ApiPropertyOptional({ example: "STUDENT", description: "Role of the user" })
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  @ApiPropertyOptional({
    example: "ACTIVE",
    description: "Status of the user",
  })
  status?: UserStatus;
}
