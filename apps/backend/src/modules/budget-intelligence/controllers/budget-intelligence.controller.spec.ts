import { BudgetIntelligenceController } from './budget-intelligence.controller';

describe('BudgetIntelligenceController', () => {
  const budgetService = { createPlan: jest.fn() };
  const globalCountryFinance = {
    getFinanceContext: jest.fn(),
    getSupportedCountryCodes: jest.fn(),
  };
  const mealPlanning = { createMealPlan: jest.fn() };
  const controller = new BudgetIntelligenceController(
    budgetService as never,
    globalCountryFinance as never,
    mealPlanning as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('passes user, servings and country into meal planning', async () => {
    mealPlanning.createMealPlan.mockResolvedValue({ generatedDeterministically: true });

    await expect(
      controller.mealPlan(
        { user: { id: 'user-1' } },
        '4',
        'JP',
      ),
    ).resolves.toEqual({ generatedDeterministically: true });

    expect(mealPlanning.createMealPlan).toHaveBeenCalledWith('user-1', 4, 'JP');
  });
});
