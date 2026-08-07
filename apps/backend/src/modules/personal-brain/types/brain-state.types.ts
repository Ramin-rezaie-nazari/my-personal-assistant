import { BrainUserContext } from './brain-user-context.types';

export type BrainState = {
  userContext?: BrainUserContext;

  context: unknown;

  memories: unknown[];

  goals: unknown[];
};
