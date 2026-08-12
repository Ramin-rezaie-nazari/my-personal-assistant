import { Injectable } from '@nestjs/common';

import { BrainContextService } from '../../brain-integration/services/brain-context.service';
import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';

import { BrainDailyStatusService } from './brain-daily-status.service';
import { BrainMemoryContextService } from './brain-memory-context.service';
import { UserContextService } from './user-context.service';

import { BrainState } from '../types';

@Injectable()
export class BrainStateService {
  constructor(
    private readonly brainContextService: BrainContextService,
    private readonly brainMemoryContextService: BrainMemoryContextService,
    private readonly brainGoalService: BrainGoalService,
    private readonly brainDailyStatusService: BrainDailyStatusService,
    private readonly userContextService: UserContextService,
  ) {}

  async buildState(query = '', userId: string): Promise<BrainState> {
    const [context, memoryContext, goals, dailyStatus] = await Promise.all([
      this.brainContextService.getContext(),
      this.brainMemoryContextService.buildMemoryContext(query, userId),
      this.brainGoalService.getGoals(userId),
      this.brainDailyStatusService.getToday(userId),
    ]);

    const userContext = this.userContextService.build({
      context,
      goals,
      memories: memoryContext.memories,
    });

    return {
      userContext,
      context,
      memories: memoryContext.memories,
      goals,
      dailyStatus,
    };
  }
}
