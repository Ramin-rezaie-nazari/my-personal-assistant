import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FitnessGoal, FitnessProfile } from '../models/fitness.model';
import { FitnessProfileService } from '../services/fitness-profile.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('fitness')
@UseGuards(JwtAuthGuard)
export class FitnessController {
  constructor(private readonly profile: FitnessProfileService) {}

  @Get('profile') getProfile(@Req() req: AuthenticatedRequest) { return this.profile.get(req.user.id); }
  @Get('context') context(@Req() req: AuthenticatedRequest) { return this.profile.buildRecommendationContext(req.user.id); }
  @Post('profile') save(@Req() req: AuthenticatedRequest, @Body() body: { profile: FitnessProfile }) { return this.profile.save(req.user.id, body.profile); }
  @Post('equipment') addEquipment(@Req() req: AuthenticatedRequest, @Body() body: { item: FitnessProfile['equipment'][number] }) { return this.profile.addEquipment(req.user.id, body.item); }
  @Delete('equipment/:id') removeEquipment(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.profile.removeEquipment(req.user.id, id); }
  @Post('goal') addGoal(@Req() req: AuthenticatedRequest, @Body() body: { goal: FitnessGoal }) { return this.profile.addGoal(req.user.id, body.goal); }
  @Post('goal/from-text') parseGoal(@Body() body: { text: string }) { return this.profile.parseNaturalGoal(body.text); }
}
