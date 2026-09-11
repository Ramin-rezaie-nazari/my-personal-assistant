import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../users.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

type AuthenticatedRequest = { user: { id: string } };

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  profile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Delete('me')
  async deleteMyAccount(@Request() req: AuthenticatedRequest) {
    return this.usersService.deleteAccount(req.user.id);
  }
}
