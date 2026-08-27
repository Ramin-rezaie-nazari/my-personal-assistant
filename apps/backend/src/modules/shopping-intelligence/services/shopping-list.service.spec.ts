import { HouseholdItemNormalizerService } from './household-item-normalizer.service';
import { HouseholdShoppingConsolidatorService } from './household-shopping-consolidator.service';
import { ShoppingListService } from './shopping-list.service';

describe('ShoppingListService', () => {
  const service = new ShoppingListService(
    new HouseholdShoppingConsolidatorService(
      new HouseholdItemNormalizerService(),
    ),
  );

  it('returns only missing requirements while preserving purchase intent', async () => {
    const result = await service.generateList(
      [
        { productKey: 'rice', quantity: 2, unit: 'kg', source: 'meal-plan' },
        { productKey: 'milk', quantity: 1, unit: 'l', source: 'meal-plan', priority: 'high' },
      ],
      [{ productKey: 'rice', quantity: 1, unit: 'kg' }],
    );

    expect(result.totalItems).toBe(2);
    expect(result.items[0].productKey).toBe('rice');
    expect(result.items[0].missingQuantity).toBe(1);
    expect(result.items[1].priority).toBe('high');
  });
});
