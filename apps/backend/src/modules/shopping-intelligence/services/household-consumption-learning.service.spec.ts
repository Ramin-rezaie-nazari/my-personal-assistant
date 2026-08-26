import { HouseholdConsumptionLearningService } from './household-consumption-learning.service';

describe('HouseholdConsumptionLearningService', () => {
  const service = new HouseholdConsumptionLearningService();

  it('records positive consumption events deterministically', () => {
    const event = service.record({
      productKey: 'milk',
      quantity: 1,
      occurredAt: new Date('2026-08-01T00:00:00Z'),
    });
    expect(event.source).toBe('manual');
    expect(service.history('milk')).toHaveLength(1);
  });

  it('returns zero-confidence forecast for sparse history', () => {
    const result = service.forecastFromHistory('milk', [
      { productKey: 'milk', quantity: 1, occurredAt: new Date('2026-08-01T00:00:00Z') },
    ]);
    expect(result.confidence).toBe(0);
    expect(result.dailyRate).toBe(0);
  });

  it('calculates a deterministic rate from durable-style history', () => {
    const result = service.forecastFromHistory('milk', [
      { productKey: 'milk', quantity: 2, occurredAt: new Date('2026-08-01T00:00:00Z') },
      { productKey: 'milk', quantity: 2, occurredAt: new Date('2026-08-11T00:00:00Z') },
      { productKey: 'milk', quantity: 2, occurredAt: new Date('2026-08-21T00:00:00Z') },
    ]);
    expect(result.dailyRate).toBe(0.3);
    expect(result.next7DayNeed).toBeCloseTo(2.1);
    expect(result.next30DayNeed).toBeCloseTo(9);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('rejects non-positive consumption', () => {
    expect(() =>
      service.record({
        productKey: 'milk',
        quantity: 0,
        occurredAt: new Date('2026-08-01T00:00:00Z'),
      }),
    ).toThrow('Consumption quantity must be positive');
  });
});
