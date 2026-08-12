import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LearningService } from '../services/learning.service';
import { UserIntelligenceService } from '../services/user-intelligence.service';
import { BehaviorAction, BehaviorContext } from '../types/behavior.types';

@Controller('user-intelligence')
@UseGuards(JwtAuthGuard)
export class UserIntelligenceController {
  constructor(private readonly userIntelligenceService: UserIntelligenceService, private readonly learning: LearningService) {}

  @Get()
  getProfile(@Request() req: { user: { id: string } }) { return this.userIntelligenceService.getProfile(req.user.id); }

  @Post('events')
  recordEvent(@Request() req: { user: { id: string } }, @Body() body: { action: BehaviorAction; context?: BehaviorContext }) { return this.learning.learnFromAction(req.user.id, body.action, body.context ?? {}); }

  @Post('analyze')
  analyze(@Request() req: { user: { id: string } }) { return this.userIntelligenceService.analyzeBehavior(req.user.id); }
}
