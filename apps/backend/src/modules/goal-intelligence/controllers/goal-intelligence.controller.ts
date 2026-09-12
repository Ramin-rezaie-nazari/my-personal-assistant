import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GoalAnalysisService } from '../services/goal-analysis.service';
import { GoalPlanningService } from '../services/goal-planning.service';
import { GoalProgressService } from '../services/goal-progress.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('goal-intelligence')
@UseGuards(JwtAuthGuard)
export class GoalIntelligenceController {
  constructor(
    private readonly analysis: GoalAnalysisService,
    private readonly planning: GoalPlanningService,
    private readonly progress: GoalProgressService,
  ) {}

  @Get('analysis')
  analyze(@Request() req: AuthenticatedRequest, @Query('goalId') goalId?: string) {
    return this.analysis.analyzeGoal(req.user.id, goalId);
  }

  @Get('plan')
  plan(@Request() req: AuthenticatedRequest, @Query('goalId') goalId?: string) {
    if (!goalId) return { goalId: null, plan: null };
    return this.planning.createGoalPlan(req.user.id, goalId);
  }

  @Get('progress')
  progressForUser(@Request() req: AuthenticatedRequest, @Query('goalId') goalId?: string) {
    return this.progress.trackProgress(req.user.id, goalId);
  }
}
