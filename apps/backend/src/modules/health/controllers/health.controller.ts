import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HealthService } from '../services/health.service';
import { NutritionService } from '../services/nutrition.service';
import { UpdateHealthProfileDto } from '../dto/update-health-profile.dto';
import { UpdateNutritionProfileDto } from '../dto/update-nutrition-profile.dto';

@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly nutritionService: NutritionService,
  ) {}

  @Get('profile')
  getHealth(@Request() req: { user: { id: string } }) {
    return this.healthService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateHealth(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateHealthProfileDto,
  ) {
    return this.healthService.updateProfile(req.user.id, dto);
  }

  @Get('nutrition')
  getNutrition(@Request() req: { user: { id: string } }) {
    return this.nutritionService.getProfile(req.user.id);
  }

  @Patch('nutrition')
  updateNutrition(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateNutritionProfileDto,
  ) {
    return this.nutritionService.updateProfile(req.user.id, dto);
  }
}
