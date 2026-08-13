export type ContextFreshness = 'fresh' | 'stale' | 'missing';

export type ContextSource<T> = {
  value: T;
  source: string;
  observedAt: string | null;
  freshness: ContextFreshness;
  confidence: number;
};

export type LifeContext = {
  userId: string;
  generatedAt: string;
  timezone?: string;
  calendar: ContextSource<Record<string, unknown>>;
  schedule: ContextSource<Record<string, unknown>>;
  habits: ContextSource<Record<string, unknown>>;
  workout: ContextSource<Record<string, unknown>>;
  supplements: ContextSource<Record<string, unknown>>;
  nutrition: ContextSource<Record<string, unknown>>;
  shopping: ContextSource<Record<string, unknown>>;
  budget: ContextSource<Record<string, unknown>>;
  memory: ContextSource<Record<string, unknown>>;
  wearable: ContextSource<Record<string, unknown>>;
};

export type LifeContextSourceInput = {
  value: Record<string, unknown>;
  source: string;
  observedAt?: Date | string | null;
  confidence?: number;
};
