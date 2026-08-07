export type BrainResponse = {
  message: string;

  intent: string;

  confidence: number;

  nextAction?: string;

  metadata?: Record<string, unknown>;
};
