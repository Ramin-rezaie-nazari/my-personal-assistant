import { Injectable } from '@nestjs/common';

import { BrainUserContext } from '../types';

@Injectable()
export class UserContextService {
  build(input: { context: unknown; goals: unknown[] }): BrainUserContext {
    return {
      profile: {},
      lifeAreas: [],
      preferences: {},
      constraints: [],
      rawContext: input.context,
      goals: input.goals,
    };
  }
}
