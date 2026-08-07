import {
  BrainReasoningResult,
  BrainReasoningSignals,
} from './brain-reasoning.types';

import { BrainState } from './brain-state.types';
import { BrainUserContext } from './brain-user-context.types';

export type BrainReasoningContext = {
  input: string;

  userContext: BrainUserContext;

  state: BrainState;

  signals: BrainReasoningSignals;

  reasoning: BrainReasoningResult;
};
