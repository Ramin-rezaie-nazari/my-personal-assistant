import { Injectable } from '@nestjs/common';

import { BrainMemory } from '../types/brain-memory.types';
import { BrainUserContext } from '../types';

import { BrainContext } from '../../brain-integration/types';

@Injectable()
export class UserContextService {
  build(input: {
    userId: string;
    context: BrainContext;
    goals: BrainUserContext['goals'];
    memories: BrainMemory[];
  }): BrainUserContext {
    return {
      userId: input.userId,
      profile: {},
      lifeAreas: [],
      preferences: {},
      constraints: [],
      rawContext: {
        context: input.context,
        memories: input.memories,
      },
      goals: input.goals,
    };
  }
}
