import { BrainDecisionResult } from './brain-decision.types';

export type ResponseTone = 'friendly' | 'professional' | 'casual';

export type ResponseLanguage = 'fa' | 'en';

export type ResponsePlan = {
  tone: ResponseTone;

  language: ResponseLanguage;

  message: string;

  intent: string;

  confidence: number;

  nextAction?: string;

  decision: BrainDecisionResult;

  metadata?: Record<string, unknown>;
};
