import { BrainGoal } from '../../brain-integration/types';
import { BrainMemory } from './brain-memory.types';
import { BrainContext } from '../../brain-integration/types';
import { BrainUserContext } from './brain-user-context.types';
import { BrainDailyStatus } from './brain-daily-status.types';
import { BrainWeeklyStatus } from './brain-weekly-status.types';
import { BrainNutritionTargets } from './brain-nutrition-targets.types';

export type BrainState = {
  userContext: BrainUserContext;
  context: BrainContext;
  memories: BrainMemory[];
  goals: BrainGoal[];
  dailyStatus: BrainDailyStatus;
  weeklyStatus?: BrainWeeklyStatus;
  nutritionTargets?: BrainNutritionTargets;
};
