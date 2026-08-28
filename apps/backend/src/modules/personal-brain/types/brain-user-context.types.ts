import { BrainGoal } from '../../brain-integration/types';
import { BrainUserContextRaw } from './brain-user-context-raw.types';

export type BrainUserContext = {
  userId?: string;

  profile: {
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    occupation?: string;
    location?: string;
    activityLevel?: string;
    targetWeightKg?: number;
  };

  lifeAreas: string[];

  preferences: Record<string, unknown>;

  constraints: string[];

  knownFacts?: string[];

  rawContext?: BrainUserContextRaw;

  goals: BrainGoal[];
};
