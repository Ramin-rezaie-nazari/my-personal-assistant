import { RecipeInventoryMatcherService } from './recipe-inventory-matcher.service';

describe('RecipeInventoryMatcherService', () => {
  const prisma = {
    recipe: { findMany: jest.fn() },
    inventoryItem: { findMany: jest.fn() },
  };

  const service = new RecipeInventoryMatcherService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('converts compatible metric mass units before matching inventory', async () => {
    prisma.recipe.findMany.mockResolvedValue([
      {
        id: 'recipe-1',
        name: 'Test recipe',
        calories: 100,
        protein: 10,
        carbs: 5,
        fat: 2,
        verified: true,
        ingredients: [
          {
            foodId: 'food-1',
            quantity: 1000,
            unit: 'g',
            food: { name: 'Rice' },
          },
        ],
      },
    ]);
    prisma.inventoryItem.findMany.mockResolvedValue([
      { foodId: 'food-1', quantity: 1, unit: 'kg', food: { name: 'Rice' } },
    ]);

    const [match] = await service.match('user-1');

    expect(match.coveragePercent).toBe(100);
    expect(match.missingCount).toBe(0);
    expect(match.available[0]).toMatchObject({ quantity: 1000, unit: 'g' });
  });

  it('does not compare incompatible units as if they were directly numeric', async () => {
    prisma.recipe.findMany.mockResolvedValue([
      {
        id: 'recipe-1',
        name: 'Test recipe',
        calories: 100,
        protein: 10,
        carbs: 5,
        fat: 2,
        verified: true,
        ingredients: [
          {
            foodId: 'food-1',
            quantity: 2,
            unit: 'kg',
            food: { name: 'Rice' },
          },
        ],
      },
    ]);
    prisma.inventoryItem.findMany.mockResolvedValue([
      { foodId: 'food-1', quantity: 500, unit: 'ml', food: { name: 'Rice' } },
    ]);

    const [match] = await service.match('user-1');

    expect(match.coveragePercent).toBe(0);
    expect(match.missingCount).toBe(1);
    expect(match.missing[0]).toMatchObject({ quantity: 2, unit: 'kg' });
  });
});
