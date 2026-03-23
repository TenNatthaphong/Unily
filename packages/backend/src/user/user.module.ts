import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminUserController } from './admin-user.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [UserService],
  controllers: [UserController, AdminUserController],
  imports: [PrismaModule]
})
export class UserModule {}
