import { Injectable } from '@nestjs/common';

import { BrainContextService } from '../../brain-integration/services/brain-context.service';
import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';

import { BrainMemoryContextService } from './brain-memory-context.service';

@Injectable()
export class BrainStateService {
  constructor(
    private readonly brainContextService: BrainContextService,
    private readonly brainMemoryContextService: BrainMemoryContextService,
    private readonly brainGoalService: BrainGoalService,
  ) {}

  async buildState(query = '') {
    const context = await this.brainContextService.getContext();

    const memoryContext =
      await this.brainMemoryContextService.buildMemoryContext(query);

    const goals = await this.brainGoalService.getGoals();

    return {
      context,
      memories: memoryContext.memories,
      goals,
    };
  }
}
