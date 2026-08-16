import { Injectable } from '@nestjs/common';
import { LifeContext } from '../types/life-context';

export type ContextPriority = {
  domain: keyof Omit<LifeContext, 'userId' | 'generatedAt' | 'timezone'>;
  priority: number;
  usable: boolean;
  reason: string;
};

@Injectable()
export class ContextPriorityResolverService {
  resolve(
    context: LifeContext,
    domains?: ContextPriority['domain'][],
  ): ContextPriority[] {
    const requested = domains ?? [
      'calendar',
      'schedule',
      'habits',
      'workout',
      'supplements',
      'nutrition',
      'shopping',
      'budget',
      'memory',
      'wearable',
    ];

    return requested
      .map((domain) => {
        const source = context[domain];
        const freshnessWeight =
          source.freshness === 'fresh'
            ? 1
            : source.freshness === 'stale'
              ? 0.45
              : 0;
        const priority = Number(
          (freshnessWeight * source.confidence).toFixed(3),
        );
        return {
          domain,
          priority,
          usable: source.freshness !== 'missing' && source.confidence >= 0.3,
          reason:
            source.freshness === 'missing'
              ? 'missing_source'
              : source.freshness === 'stale'
                ? 'stale_source'
                : 'fresh_source',
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }
}
