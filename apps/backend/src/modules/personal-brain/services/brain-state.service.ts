import { Injectable } from '@nestjs/common';

import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';

import { BrainDailyStatusService } from './brain-daily-status.service';
import { BrainLifeContextService } from './brain-life-context.service';
import { BrainMemoryContextService } from './brain-memory-context.service';
import { BrainNutritionTargetsService } from './brain-nutrition-targets.service';
import { BrainWeeklyStatusService } from './brain-weekly-status.service';
import { BrainWorkoutStatusService } from './brain-workout-status.service';
import { UserContextService } from './user-context.service';

import { BrainState } from '../types';

@Injectable()
export class BrainStateService {
  constructor(
    private readonly brainMemoryContextService: BrainMemoryContextService,
    private readonly brainGoalService: BrainGoalService,
    private readonly brainDailyStatusService: BrainDailyStatusService,
    private readonly brainWeeklyStatusService: BrainWeeklyStatusService,
    private readonly brainNutritionTargetsService: BrainNutritionTargetsService,
    private readonly brainWorkoutStatusService: BrainWorkoutStatusService,
    private readonly brainLifeContextService: BrainLifeContextService,
    private readonly userContextService: UserContextService,
  ) {}

  async buildState(query = '', userId: string): Promise<BrainState> {
    const [memoryContext, goals, dailyStatus, weeklyStatus, nutritionTargets, workoutStatus, lifeContext] = await Promise.all([
      this.brainMemoryContextService.buildMemoryContext(query, userId),
      this.brainGoalService.getGoals(userId),
      this.brainDailyStatusService.getToday(userId),
      this.brainWeeklyStatusService.getThisWeek(userId),
      this.brainNutritionTargetsService.getTargets(userId),
      this.brainWorkoutStatusService.getThisWeek(userId),
      this.brainLifeContextService.getToday(userId),
    ]);

    const context = { timestamp: new Date().toISOString(), source: 'brain-state' };
    const userContext = this.userContextService.build({ context, goals, memories: memoryContext.memories });

    return { userContext, context, memories: memoryContext.memories, goals, dailyStatus, weeklyStatus, nutritionTargets, workoutStatus, lifeContext };
  }
}
