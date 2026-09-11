import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HealthService } from '../services/health.service';
import { NutritionService } from '../services/nutrition.service';
import { UpdateHealthProfileDto } from '../dto/update-health-profile.dto';
import { UpdateNutritionProfileDto } from '../dto/update-nutrition-profile.dto';

type AuthenticatedRequest = { user: { id: string } };

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService, private readonly nutritionService: NutritionService) {}

  @Get()
  liveness() {
    return { status: 'ok', service: 'My Personal Assistant API', timestamp: new Date().toISOString() };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getHealth(@Request() req: AuthenticatedRequest) { return this.healthService.getProfile(req.user.id); }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateHealth(@Request() req: AuthenticatedRequest, @Body() dto: UpdateHealthProfileDto) { return this.healthService.updateProfile(req.user.id, dto); }

  @Get('nutrition')
  @UseGuards(JwtAuthGuard)
  getNutrition(@Request() req: AuthenticatedRequest) { return this.nutritionService.getProfile(req.user.id); }

  @Patch('nutrition')
  @UseGuards(JwtAuthGuard)
  updateNutrition(@Request() req: AuthenticatedRequest, @Body() dto: UpdateNutritionProfileDto) { return this.nutritionService.updateProfile(req.user.id, dto); }
}
