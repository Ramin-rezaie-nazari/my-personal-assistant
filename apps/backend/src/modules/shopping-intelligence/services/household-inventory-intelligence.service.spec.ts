import { HouseholdInventoryIntelligenceService } from './household-inventory-intelligence.service';

describe('HouseholdInventoryIntelligenceService', () => {
  const service = new HouseholdInventoryIntelligenceService();

  it('predicts stockout and recommends reorder quantity', () => {
    const result = service.forecast([{ productKey: 'milk', quantity: 2, unit: 'L', dailyConsumption: 1, safetyStock: 2, essential: true }])[0];
    expect(result.daysRemaining).toBe(2);
    expect(result.urgency).toBe('critical');
    expect(result.recommendedQuantity).toBe(2);
  });

  it('prioritizes critical essential items first', () => {
    const result = service.prioritize([
      { productKey: 'soap', quantity: 1, unit: 'pcs', dailyConsumption: 0.1, safetyStock: 1 },
      { productKey: 'milk', quantity: 0, unit: 'L', dailyConsumption: 1, safetyStock: 2, essential: true },
    ]);
    expect(result[0].productKey).toBe('milk');
  });
});
