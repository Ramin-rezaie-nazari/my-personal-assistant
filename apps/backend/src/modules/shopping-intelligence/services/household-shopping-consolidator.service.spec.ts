import { HouseholdItemNormalizerService } from './household-item-normalizer.service';
import { HouseholdShoppingConsolidatorService } from './household-shopping-consolidator.service';

describe('HouseholdShoppingConsolidatorService', () => {
  const service = new HouseholdShoppingConsolidatorService(
    new HouseholdItemNormalizerService(),
  );

  it('merges duplicate requirements and preserves sources', () => {
    const result = service.consolidate(
      [
        { productKey: 'rice', quantity: 1, unit: 'kg', source: 'meal-1' },
        { productKey: 'Rice', quantity: 500, unit: 'g', source: 'meal-2', priority: 'high' },
      ],
      [],
    );
    expect(result).toEqual([
      {
        productKey: 'rice',
        quantity: 1.5,
        unit: 'kg',
        ownedQuantity: 0,
        missingQuantity: 1.5,
        sources: ['meal-1', 'meal-2'],
        priority: 'high',
      },
    ]);
  });

  it('subtracts equivalent inventory using unit conversion', () => {
    const result = service.missingOnly(
      [{ productKey: 'milk', quantity: 2, unit: 'l', source: 'meal-plan' }],
      [{ productKey: 'MILK', quantity: 500, unit: 'ml' }],
    );
    expect(result[0].ownedQuantity).toBe(0.5);
    expect(result[0].missingQuantity).toBe(1.5);
  });

  it('does not return fully covered items from missingOnly', () => {
    const result = service.missingOnly(
      [{ productKey: 'bread', quantity: 2, unit: 'pcs' }],
      [{ productKey: 'bread', quantity: 2, unit: 'pcs' }],
    );
    expect(result).toEqual([]);
  });

  it('fails safely on incompatible units instead of guessing', () => {
    expect(() =>
      service.consolidate(
        [{ productKey: 'oil', quantity: 1, unit: 'l' }],
        [{ productKey: 'oil', quantity: 1, unit: 'kg' }],
      ),
    ).toThrow('incompatible');
  });
});
