import { Injectable } from '@nestjs/common';
import { ContextFreshness, LifeContext, LifeContextSourceInput } from '../types/life-context';

@Injectable()
export class LifeContextFusionService {
  private readonly maxFreshAgeMs = 60 * 60 * 1000;
  private readonly maxConfidence = 1;

  build(userId: string, sources: Partial<Record<keyof Omit<LifeContext, 'userId' | 'generatedAt' | 'timezone'>, LifeContextSourceInput>>, now = new Date(), timezone?: string): LifeContext {
    const make = (key: string): LifeContext['calendar'] => {
      const input = sources[key as keyof typeof sources];
      if (!input) return { value: {}, source: 'missing', observedAt: null, freshness: 'missing', confidence: 0 };
      const observedAt = input.observedAt ? new Date(input.observedAt) : null;
      const age = observedAt ? Math.max(0, now.getTime() - observedAt.getTime()) : Number.POSITIVE_INFINITY;
      const freshness: ContextFreshness = age <= this.maxFreshAgeMs ? 'fresh' : 'stale';
      return {
        value: input.value,
        source: input.source,
        observedAt: observedAt?.toISOString() ?? null,
        freshness,
        confidence: Math.max(0, Math.min(this.maxConfidence, input.confidence ?? 0.5)),
      };
    };

    return {
      userId,
      generatedAt: now.toISOString(),
      ...(timezone ? { timezone } : {}),
      calendar: make('calendar'),
      schedule: make('schedule'),
      habits: make('habits'),
      workout: make('workout'),
      supplements: make('supplements'),
      nutrition: make('nutrition'),
      shopping: make('shopping'),
      budget: make('budget'),
      memory: make('memory'),
      wearable: make('wearable'),
    };
  }
}
