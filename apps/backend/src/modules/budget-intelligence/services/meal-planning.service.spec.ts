import { MealPlanningService } from './meal-planning.service';

describe('MealPlanningService', () => {
  const prisma = {
    recipe: { findMany: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
  };
  const service = new MealPlanningService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('builds three deterministic meals around daily nutrition targets', async () => {
    prisma.recipe.findMany.mockResolvedValue([
      { id: 'r1', name: 'Chicken Bowl', servings: 2, calories: 800, protein: 80, verified: true },
      { id: 'r2', name: 'Rice Plate', servings: 2, calories: 1000, protein: 50, verified: true },
      { id: 'r3', name: 'Yogurt Oats', servings: 2, calories: 600, protein: 30, verified: false },
    ]);
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 2400,
      proteinGoalGrams: 150,
    });

    const result = await service.createMealPlan('user-1', 2, 'JP');

    expect(result.targetServings).toBe(2);
    expect(result.countryCode).toBe('JP');
    expect(result.meals).toHaveLength(3);
    expect(result.generatedDeterministically).toBe(true);
    expect(result.targets.caloriesPerMeal).toBe(800);
    expect(result.targets.proteinPerMealGrams).toBe(50);
  });

  it('rejects invalid serving counts', async () => {
    await expect(service.createMealPlan('user-1', 0)).rejects.toThrow();
    await expect(service.createMealPlan('user-1', 10001)).rejects.toThrow();
  });
});
