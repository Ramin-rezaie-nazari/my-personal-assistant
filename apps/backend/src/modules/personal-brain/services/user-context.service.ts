import { Injectable } from '@nestjs/common';

import { BrainUserContext } from '../types';

@Injectable()
export class UserContextService {
  build(input: {
    context: unknown;
    goals: BrainUserContext['goals'];
    memories: unknown[];
  }): BrainUserContext {
    return {
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
