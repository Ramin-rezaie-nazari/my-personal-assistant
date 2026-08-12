import { HouseholdConsumptionLearningService } from './household-consumption-learning.service';

describe('HouseholdConsumptionLearningService', () => {
  it('learns a daily consumption rate from historical events', () => {
    const service = new HouseholdConsumptionLearningService();
    service.record({ productKey: 'milk', quantity: 1, occurredAt: new Date('2026-08-01T00:00:00Z') });
    service.record({ productKey: 'milk', quantity: 2, occurredAt: new Date('2026-08-04T00:00:00Z') });
    const result = service.forecast('milk', new Date('2026-08-05T00:00:00Z'));
    expect(result.dailyRate).toBeCloseTo(1);
    expect(result.next7DayNeed).toBeCloseTo(7);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('stays conservative with insufficient history', () => {
    const service = new HouseholdConsumptionLearningService();
    service.record({ productKey: 'rice', quantity: 1, occurredAt: new Date('2026-08-01T00:00:00Z') });
    expect(service.forecast('rice').confidence).toBe(0);
    expect(service.forecast('rice').dailyRate).toBe(0);
  });

  it('rejects invalid consumption events', () => {
    const service = new HouseholdConsumptionLearningService();
    expect(() => service.record({ productKey: 'soap', quantity: 0, occurredAt: new Date() })).toThrow();
  });
});
