import { ContextPriorityResolverService } from './context-priority-resolver.service';
import { LifeContext } from '../types/life-context';

describe('ContextPriorityResolverService', () => {
  it('gives stale data less weight than fresh data', () => {
    const service = new ContextPriorityResolverService();
    const context = {
      userId: 'u1',
      generatedAt: '2026-08-13T04:00:00.000Z',
      calendar: { value: {}, source: 'calendar', observedAt: '2026-08-13T03:59:00.000Z', freshness: 'fresh', confidence: 0.8 },
      schedule: { value: {}, source: 'schedule', observedAt: '2026-08-13T01:00:00.000Z', freshness: 'stale', confidence: 1 },
    } as LifeContext;

    const result = service.resolve(context, ['calendar', 'schedule']);
    expect(result[0].domain).toBe('calendar');
    expect(result.find((item) => item.domain === 'schedule')?.priority).toBeLessThan(
      result.find((item) => item.domain === 'calendar')?.priority ?? 0,
    );
  });
});
