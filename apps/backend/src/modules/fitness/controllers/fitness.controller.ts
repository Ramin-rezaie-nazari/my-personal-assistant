import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FitnessEquipment, FitnessGoal, FitnessProfile } from '../models/fitness.model';
import { FitnessProfileService } from '../services/fitness-profile.service';

@Controller('fitness')
@UseGuards(JwtAuthGuard)
export class FitnessController {
  constructor(private readonly profile: FitnessProfileService) {}

  @Get('profile')
  getProfile(@Body() body: { userId: string }) { return this.profile.get(body.userId); }

  @Get('context')
  context(@Body() body: { userId: string }) { return this.profile.buildRecommendationContext(body.userId); }

  @Post('profile')
  save(@Body() body: { userId: string; profile: FitnessProfile }) { return this.profile.save(body.userId, body.profile); }

  @Post('equipment')
  addEquipment(@Body() body: { userId: string; item: FitnessProfile['equipment'][number] }) { return this.profile.addEquipment(body.userId, body.item); }

  @Delete('equipment/:id')
  removeEquipment(@Body() body: { userId: string }, @Param('id') id: string) { return this.profile.removeEquipment(body.userId, id); }

  @Post('goal')
  addGoal(@Body() body: { userId: string; goal: FitnessGoal }) { return this.profile.addGoal(body.userId, body.goal); }

  @Post('goal/from-text')
  parseGoal(@Body() body: { text: string }) { return this.profile.parseNaturalGoal(body.text); }
}
