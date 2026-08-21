import { BudgetIntelligenceService } from './budget-intelligence.service';

describe('BudgetIntelligenceService weekly optimizer', () => {
  function buildService() {
    const now = new Date();
    const recipes = [
      {
        id: 'r1',
        userId: null,
        name: 'Lentil Rice Bowl',
        description: 'Affordable high-protein bowl',
        servings: 2,
        calories: 900,
        protein: 40,
        carbs: 130,
        fat: 18,
        verified: true,
        createdAt: now,
        updatedAt: now,
        ingredients: [
          { quantity: 400, unit: 'g', food: { name: 'lentil' } },
          { quantity: 300, unit: 'g', food: { name: 'rice' } },
        ],
      },
      {
        id: 'r2',
        userId: null,
        name: 'Chicken Rice Bowl',
        description: 'Chicken and rice',
        servings: 2,
        calories: 1100,
        protein: 70,
        carbs: 120,
        fat: 20,
        verified: true,
        createdAt: now,
        updatedAt: now,
        ingredients: [
          { quantity: 500, unit: 'g', food: { name: 'chicken' } },
          { quantity: 300, unit: 'g', food: { name: 'rice' } },
        ],
      },
      {
        id: 'r3',
        userId: null,
        name: 'Tomato Pasta',
        description: 'Simple pasta',
        servings: 2,
        calories: 1000,
        protein: 25,
        carbs: 160,
        fat: 12,
        verified: false,
        createdAt: now,
        updatedAt: now,
        ingredients: [
          { quantity: 300, unit: 'g', food: { name: 'pasta' } },
          { quantity: 200, unit: 'g', food: { name: 'tomato' } },
        ],
      },
    ];

    const prisma = {
      recipe: { findMany: jest.fn().mockResolvedValue(recipes) },
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([
          { quantity: 500, unit: 'g', food: { name: 'rice' } },
        ]),
      },
    };

    const prices = {
      latest: jest.fn().mockResolvedValue([
        { productKey: 'lentil', unitPrice: 1, unit: 'kg', currency: 'IRR', observedAt: now },
        { productKey: 'rice', unitPrice: 2, unit: 'kg', currency: 'IRR', observedAt: now },
        { productKey: 'chicken', unitPrice: 8, unit: 'kg', currency: 'IRR', observedAt: now },
        { productKey: 'pasta', unitPrice: 3, unit: 'kg', currency: 'IRR', observedAt: now },
        { productKey: 'tomato', unitPrice: 2, unit: 'kg', currency: 'IRR', observedAt: now },
      ]),
    };

    return {
      service: new BudgetIntelligenceService(prisma as never, prices as never),
      prisma,
      prices,
    };
  }

  it('builds a seven-day plan, prefers affordable recipes, and reuses owned inventory in cost estimation', async () => {
    const { service } = buildService();

    const result = await service.createWeeklyPlan('user-1', {
      monthlyBudget: 1000,
      familySize: 2,
      goal: 'healthy affordable meals',
      weeklyBudget: 250,
      days: 7,
      mealsPerDay: 3,
      currency: 'IRR',
    });

    expect(result.status).toBe('complete');
    expect(result.meals).toHaveLength(21);
    expect(result.meta.pricesWereAvailable).toBe(true);
    expect(result.budget.plannedEstimatedCost).not.toBeNull();
    expect(result.budget.currency).toBe('IRR');
    expect(result.meals.some((meal) => meal.recipeId === 'r1')).toBe(true);
    expect(result.shopping.length).toBeGreaterThan(0);
    expect(result.shopping.some((item) => item.name === 'rice' && item.quantity > 0)).toBe(true);
  });

  it('converts ingredient grams into price kilograms instead of multiplying incompatible units', async () => {
    const { service } = buildService();

    const result = await service.createWeeklyPlan('user-1', {
      monthlyBudget: 1000,
      familySize: 2,
      goal: 'healthy affordable meals',
      weeklyBudget: 250,
      days: 1,
      mealsPerDay: 1,
      currency: 'IRR',
    });

    expect(result.budget.plannedEstimatedCost).not.toBeNull();
    expect(result.budget.plannedEstimatedCost as number).toBeLessThan(250);
  });

  it('does not fabricate a price when no current unit price exists', async () => {
    const { service, prices } = buildService();
    prices.latest.mockResolvedValue([]);

    const result = await service.createWeeklyPlan('user-1', {
      monthlyBudget: 1000,
      familySize: 2,
      goal: 'healthy affordable meals',
      days: 7,
      mealsPerDay: 1,
    });

    expect(result.budget.plannedEstimatedCost).toBeNull();
    expect(result.budget.budgetConfidence).toBe(0);
    expect(result.meta.pricesWereAvailable).toBe(false);
  });

  it('does not mix currencies when a plan explicitly requests one currency', async () => {
    const { service, prices } = buildService();
    prices.latest.mockResolvedValue([
      { productKey: 'lentil', unitPrice: 1, unit: 'kg', currency: 'EUR', observedAt: new Date() },
      { productKey: 'rice', unitPrice: 2, unit: 'kg', currency: 'IRR', observedAt: new Date() },
    ]);

    const result = await service.createWeeklyPlan('user-1', {
      monthlyBudget: 1000,
      familySize: 2,
      goal: 'healthy affordable meals',
      weeklyBudget: 250,
      days: 1,
      mealsPerDay: 1,
      currency: 'IRR',
    });

    expect(result.meta.priceCurrencyFiltered).toBe(true);
    expect(result.budget.currency).toBe('IRR');
  });
});
