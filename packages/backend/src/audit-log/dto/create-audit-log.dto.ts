import { IsEnum, IsString } from "class-validator";
import { Action } from "@prisma/client";

export class CreateAuditLogDto {
    @IsString()
    adminId: string;
    @IsString()
    adminName: string;
    @IsEnum(Action)
    action: Action;
    @IsString()
    target: string;
}