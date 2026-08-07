import { BrainContext, BrainMemory } from '../../brain-integration/types';

export type BrainUserContextRaw = {
  context: BrainContext;

  memories: BrainMemory[];
};
