import { BrainGoal } from '../../brain-integration/types';
import { BrainUserContextRaw } from './brain-user-context-raw.types';

export type BrainUserContext = {
  userId?: string;

  profile: {
    age?: number;
    occupation?: string;
    location?: string;
  };

  lifeAreas: string[];

  preferences: Record<string, unknown>;

  constraints: string[];

  rawContext?: BrainUserContextRaw;

  goals: BrainGoal[];
};
