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

type AuthenticatedRequest = { user: { sub: string } };

@Controller('fitness')
@UseGuards(JwtAuthGuard)
export class FitnessController {
  constructor(private readonly profile: FitnessProfileService) {}

  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.profile.get(req.user.sub);
  }

  @Get('context')
  context(@Req() req: AuthenticatedRequest) {
    return this.profile.buildRecommendationContext(req.user.sub);
  }

  @Post('profile')
  save(
    @Req() req: AuthenticatedRequest,
    @Body() body: { profile: FitnessProfile },
  ) {
    return this.profile.save(req.user.sub, body.profile);
  }

  @Post('equipment')
  addEquipment(
    @Req() req: AuthenticatedRequest,
    @Body() body: { item: FitnessProfile['equipment'][number] },
  ) {
    return this.profile.addEquipment(req.user.sub, body.item);
  }

  @Delete('equipment/:id')
  removeEquipment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.profile.removeEquipment(req.user.sub, id);
  }

  @Post('goal')
  addGoal(
    @Req() req: AuthenticatedRequest,
    @Body() body: { goal: FitnessGoal },
  ) {
    return this.profile.addGoal(req.user.sub, body.goal);
  }

  @Post('goal/from-text')
  parseGoal(@Body() body: { text: string }) {
    return this.profile.parseNaturalGoal(body.text);
  }
}
