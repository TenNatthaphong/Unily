import { Controller, Get, Param, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.userService.findById(req.user.id);
  }

  @Patch('profile')
  async updateOwnProfile(@Body() updateDto: UpdateUserDto, @Req() req: any) {
    return this.userService.updateOwnProfile(req.user.id, updateDto);
  }
}
