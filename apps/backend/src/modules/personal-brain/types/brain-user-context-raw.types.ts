import { BrainContext } from '../../brain-integration/types';

import { BrainMemory } from './brain-memory.types';

export type BrainUserContextRaw = {
  context: BrainContext;

  memories: BrainMemory[];
};
