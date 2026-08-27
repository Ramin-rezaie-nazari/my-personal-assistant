import { HouseholdInventoryIntelligenceService } from './household-inventory-intelligence.service';

describe('HouseholdInventoryIntelligenceService', () => {
  const service = new HouseholdInventoryIntelligenceService();

  it('predicts stockout and recommends reorder quantity', () => {
    const result = service.forecast([
      {
        productKey: 'milk',
        quantity: 2,
        unit: 'L',
        dailyConsumption: 1,
        safetyStock: 2,
        essential: true,
      },
    ], new Date('2026-08-01T00:00:00Z'))[0];
    expect(result.daysRemaining).toBe(2);
    expect(result.urgency).toBe('critical');
    expect(result.recommendedQuantity).toBe(2);
  });

  it('uses consumption horizon plus safety stock for the reorder target', () => {
    const result = service.forecast([
      {
        productKey: 'rice',
        quantity: 3,
        unit: 'kg',
        dailyConsumption: 2,
        safetyStock: 1,
      },
    ], new Date('2026-08-01T00:00:00Z'))[0];

    expect(result.reorderPoint).toBe(5);
    expect(result.recommendedQuantity).toBe(2);
    expect(result.urgency).toBe('critical');
  });

  it('marks an item as urgent when it expires imminently', () => {
    const result = service.forecast([
      {
        productKey: 'yogurt',
        quantity: 10,
        unit: 'pcs',
        expiresAt: new Date('2026-08-01T12:00:00Z'),
      },
    ], new Date('2026-08-01T00:00:00Z'))[0];

    expect(result.expiryDaysRemaining).toBe(0.5);
    expect(result.urgency).toBe('critical');
    expect(result.reason).toBe('stock_expires_soon');
  });

  it('prioritizes critical essential items first', () => {
    const result = service.prioritize([
      {
        productKey: 'soap',
        quantity: 1,
        unit: 'pcs',
        dailyConsumption: 0.1,
        safetyStock: 1,
      },
      {
        productKey: 'milk',
        quantity: 0,
        unit: 'L',
        dailyConsumption: 1,
        safetyStock: 2,
        essential: true,
      },
    ], new Date('2026-08-01T00:00:00Z'));
    expect(result[0].productKey).toBe('milk');
  });
});
