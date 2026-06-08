import { Module } from '@nestjs/common';
import { AcademicRecordService } from './academic-record.service';
import { AcademicRecordController } from './academic-record.controller';
import { PrismaModule } from '../course/prisma/prisma.module';

@Module({
    providers: [AcademicRecordService],
    controllers: [AcademicRecordController],
    imports: [PrismaModule]
})
export class AcademicRecordModule { }