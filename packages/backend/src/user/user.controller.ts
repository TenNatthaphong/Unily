import { Controller, Get, Param, Patch, Body, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('profile')
  async getProfile(@Param('id') id: string, @Req() req: any) {
    // Ideally use req.user.id for security, but keeping backwards compatibility
    const userId = id || (req.user && req.user.id);
    return this.userService.findById(userId);
  }

  @Patch('profile')
  async updateOwnProfile(@Param('id') id: string, @Body() updateDto: UpdateUserDto, @Req() req: any) {
    // Prevent updating role or status directly
    const userId = id || (req.user && req.user.id);
    return this.userService.updateOwnProfile(userId, updateDto);
  }
}
