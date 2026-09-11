import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthRateLimitGuard } from '../guards/auth-rate-limit.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  login(@Body() dto: LoginDto) { return this.authService.login(dto.email, dto.password); }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: { user: unknown }) { return req.user; }

  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
  refresh(@Body() dto: RefreshTokenDto) { return this.authService.refreshToken(dto); }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Request() req: { user: { id: string } }, @Body() dto: LogoutDto) { return this.authService.logoutForUser(req.user.id, dto.refreshToken); }
}
