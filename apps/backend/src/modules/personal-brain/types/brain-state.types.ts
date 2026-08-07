import { BrainGoal } from '../../brain-integration/types';
import { BrainMemory } from './brain-memory.types';
import { BrainUserContext } from './brain-user-context.types';

export type BrainState = {
  userContext: BrainUserContext;

  context: unknown;

  memories: BrainMemory[];

  goals: BrainGoal[];
};
