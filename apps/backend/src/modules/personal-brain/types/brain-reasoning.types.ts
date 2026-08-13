import { BrainUserContext } from './brain-user-context.types';
import { BrainLifeContext } from './brain-life-context.types';

export type BrainReasoningSignals = {
  hasContext: boolean;
  hasMemories: boolean;
  hasGoals: boolean;
  hasLifeContext: boolean;
  memoryCount: number;
  goalCount: number;
  contextSource?: string;
  lifeContextQuality: number;
};

export type BrainReasoningInput = {
  input: string;
  userContext: BrainUserContext;
  signals: BrainReasoningSignals;
  lifeContext?: BrainLifeContext;
};

export type BrainReasoningFactor = {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  reason: string;
};

export type BrainReasoningResult = {
  confidence: number;
  uncertainties: string[];
  reasoningSummary: string;
  contextScore: number;
  factors: BrainReasoningFactor[];
};
