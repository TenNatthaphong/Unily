import { IsString, IsInt, Min, Max, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { CurriculumStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CurriculumItemWithoutIdDto } from 'src/curriculum-item/dto/create-curriculum-item.dto';

export class CreateCurriculumDto {
  @IsString()
  @ApiProperty({example: '04062566'})
  id: string;

  @IsString()
  @ApiProperty({example: 'CURR-04062566'})
  curriculumCode: string;

  @IsString()
  @ApiProperty({example: 'วิทยาการคอมพิวเตอร์ 2566'})
  name: string;

  @IsInt()
  @Min(2500)
  @Max(2600)
  @ApiProperty({example: 2566})
  year: number;

  @IsString()
  @ApiProperty({example: '04'})
  facultyId: string;

  @IsString()
  @ApiProperty({example: '06'})
  deptId: string;

  @IsString()
  @ApiProperty({example: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ประจำปีการศึกษา 2566'})
  description: string;

  @IsEnum(CurriculumStatus)
  @ApiProperty({example: 'ACTIVE'})
  status: CurriculumStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumItemWithoutIdDto)
  items: CurriculumItemWithoutIdDto[]; // รายการวิชาและตำแหน่ง (1,1)
}