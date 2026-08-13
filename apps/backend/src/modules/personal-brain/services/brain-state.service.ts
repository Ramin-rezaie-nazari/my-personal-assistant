import { Injectable } from '@nestjs/common';

import { ContextEngineService } from '../../context-engine/services/context-engine.service';
import { LifeContextFusionService } from '../../context-engine/services/life-context-fusion.service';
import { BrainContextService } from '../../brain-integration/services/brain-context.service';
import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';

import { BrainDailyStatusService } from './brain-daily-status.service';
import { BrainLifeContextService } from './brain-life-context.service';
import { BrainMemoryContextService } from './brain-memory-context.service';
import { BrainNutritionTargetsService } from './brain-nutrition-targets.service';
import { BrainWeeklyStatusService } from './brain-weekly-status.service';
import { BrainWorkoutStatusService } from './brain-workout-status.service';
import { UserContextService } from './user-context.service';

import type { BrainState } from '../types';

@Injectable()
export class BrainStateService {
  constructor(
    private readonly brainContextService: BrainContextService,
    private readonly brainMemoryContextService: BrainMemoryContextService,
    private readonly brainGoalService: BrainGoalService,
    private readonly brainDailyStatusService: BrainDailyStatusService,
    private readonly brainWeeklyStatusService: BrainWeeklyStatusService,
    private readonly brainNutritionTargetsService: BrainNutritionTargetsService,
    private readonly brainWorkoutStatusService: BrainWorkoutStatusService,
    private readonly brainLifeContextService: BrainLifeContextService,
    private readonly userContextService: UserContextService,
    private readonly contextEngineService: ContextEngineService,
    private readonly lifeContextFusionService: LifeContextFusionService,
  ) {}

  async buildState(query = '', userId: string): Promise<BrainState> {
    const [context, memoryContext, goals, dailyStatus, weeklyStatus, nutritionTargets, workoutStatus, lifeContext] = await Promise.all([
      this.brainContextService.getContext(),
      this.brainMemoryContextService.buildMemoryContext(query, userId),
      this.brainGoalService.getGoals(userId),
      this.brainDailyStatusService.getToday(userId),
      this.brainWeeklyStatusService.getThisWeek(userId),
      this.brainNutritionTargetsService.getTargets(userId),
      this.brainWorkoutStatusService.getThisWeek(userId),
      this.brainLifeContextService.getToday(userId),
    ]);

    const generatedContext = await this.contextEngineService.buildContext(userId);
    // Keep the generic fused context available to the context engine layer, but expose the strongly typed BrainLifeContext here.
    this.lifeContextFusionService.build(userId, {
      calendar: { value: lifeContext.reminders ?? {}, source: 'brain-life-context', observedAt: new Date(), confidence: 0.85 },
      schedule: { value: { dailyStatus, weeklyStatus }, source: 'brain-schedule', observedAt: new Date(), confidence: 0.8 },
      habits: { value: lifeContext.habits ?? {}, source: 'brain-life-context', observedAt: new Date(), confidence: 0.9 },
      workout: { value: { workoutStatus }, source: 'brain-workout-status', observedAt: new Date(), confidence: 0.9 },
      supplements: { value: lifeContext.supplements ?? {}, source: 'brain-life-context', observedAt: new Date(), confidence: 0.9 },
      nutrition: { value: { nutritionTargets }, source: 'brain-nutrition-targets', observedAt: new Date(), confidence: 0.9 },
      memory: { value: { memories: memoryContext.memories }, source: 'brain-memory-context', observedAt: new Date(), confidence: 0.95 },
      shopping: { value: {}, source: 'shopping', observedAt: null, confidence: 0 },
      budget: { value: {}, source: 'budget', observedAt: null, confidence: 0 },
      wearable: { value: {}, source: 'wearable', observedAt: null, confidence: 0 },
    });

    const userContext = this.userContextService.build({ context: { ...generatedContext, timestamp: new Date().toISOString(), source: 'context-engine' }, goals, memories: memoryContext.memories });

    return {
      userContext,
      context: { ...generatedContext, timestamp: new Date().toISOString(), source: 'context-engine' },
      memories: memoryContext.memories,
      goals,
      dailyStatus,
      weeklyStatus,
      nutritionTargets,
      workoutStatus,
      lifeContext,
    };
  }
}
