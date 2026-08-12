import { Injectable } from '@nestjs/common';

import { BrainContextService } from '../../brain-integration/services/brain-context.service';
import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';

import { BrainMemoryContextService } from './brain-memory-context.service';
import { UserContextService } from './user-context.service';

import { BrainState } from '../types';

@Injectable()
export class BrainStateService {
  constructor(
    private readonly brainContextService: BrainContextService,
    private readonly brainMemoryContextService: BrainMemoryContextService,
    private readonly brainGoalService: BrainGoalService,
    private readonly userContextService: UserContextService,
  ) {}

  async buildState(query = '', userId: string): Promise<BrainState> {
    const context = await this.brainContextService.getContext();

    const memoryContext =
      await this.brainMemoryContextService.buildMemoryContext(query, userId);

    const goals = await this.brainGoalService.getGoals(userId);

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
    };
  }
}
