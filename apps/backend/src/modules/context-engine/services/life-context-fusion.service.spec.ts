import { LifeContextFusionService } from './life-context-fusion.service';

describe('LifeContextFusionService', () => {
  it('marks recent sources as fresh and clamps confidence', () => {
    const service = new LifeContextFusionService();
    const now = new Date('2026-08-13T04:00:00.000Z');
    const context = service.build(
      'u1',
      {
        wearable: {
          value: { steps: 1200 },
          source: 'watch',
          observedAt: new Date('2026-08-13T03:45:00.000Z'),
          confidence: 4,
        },
      },
      now,
    );

    expect(context.wearable.freshness).toBe('fresh');
    expect(context.wearable.confidence).toBe(1);
    expect(context.calendar.freshness).toBe('missing');
  });

  it('marks old sources as stale', () => {
    const service = new LifeContextFusionService();
    const now = new Date('2026-08-13T04:00:00.000Z');
    const context = service.build(
      'u1',
      {
        budget: {
          value: { remaining: 100 },
          source: 'budget-db',
          observedAt: new Date('2026-08-12T20:00:00.000Z'),
          confidence: 0.8,
        },
      },
      now,
    );

    expect(context.budget.freshness).toBe('stale');
  });
});
