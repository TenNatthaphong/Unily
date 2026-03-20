import { CreateUserDto } from "./create-user.dto";
import { IsString, IsInt, IsEnum, IsNumber} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { StudentStatus} from "@prisma/client";

export class CreateStudentDto extends CreateUserDto {

    @IsString()
    @ApiProperty({ example: "6604062630188", description: "Student code of the user", })
    studentCode: string;

    @IsString()
    @ApiProperty({ example: "04", description: "Faculty ID of the user", })
    facultyId: string;

    @IsString()
    @ApiProperty({ example: "06", description: "Department ID of the user", })
    deptId: string;

    @IsInt()
    @ApiProperty({ example: 2566, description: "Entry year of the user", })
    entryYear: number;

    @IsInt()
    @ApiProperty({ example: 1, description: "Year of the user", })
    year: number;

    @IsNumber()
    @ApiProperty({ example: 0.00, description: "GPAX of the user", })
    gpax: number;

    @IsEnum(StudentStatus)
    @ApiProperty({ example: "STUDYING", description: "Status of the user", })
    studentStatus: StudentStatus;
}
