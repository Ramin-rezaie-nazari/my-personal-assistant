import { Injectable } from '@nestjs/common';

import { BrainContextService } from '../../brain-integration/services/brain-context.service';
import { BrainMemoryService } from '../../brain-integration/services/brain-memory.service';
import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';

@Injectable()
export class BrainStateService {
  constructor(
    private readonly brainContextService: BrainContextService,
    private readonly brainMemoryService: BrainMemoryService,
    private readonly brainGoalService: BrainGoalService,
  ) {}

  async buildState() {
    const context = await this.brainContextService.getContext();
    const memories = await this.brainMemoryService.getMemories();
    const goals = await this.brainGoalService.getGoals();

    return {
      context,
      memories,
      goals,
    };
  }
}
