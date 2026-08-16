import { ResponsePlan } from './response-plan.types';

export type BrainResponse = {
  message: string;

  intent: string;

  confidence: number;

  nextAction?: string;

  responsePlan?: ResponsePlan;

  metadata?: Record<string, unknown>;
};
