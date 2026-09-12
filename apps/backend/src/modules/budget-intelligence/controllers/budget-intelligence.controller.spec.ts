import { BudgetIntelligenceController } from './budget-intelligence.controller';

describe('BudgetIntelligenceController', () => {
  const budget = { createPlan: jest.fn() };
  const globalCountryFinance = {
    getFinanceContext: jest.fn(),
    getSupportedCountryCodes: jest.fn(),
  };
  const mealPlanning = { createMealPlan: jest.fn() };
  const controller = new BudgetIntelligenceController(
    budget as never,
    globalCountryFinance as never,
    mealPlanning as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated user, budget and currency to the budget service', async () => {
    budget.createPlan.mockResolvedValue({ ok: true });
    await expect(
      controller.plan({ user: { id: 'user-1' } }, '15000000', 'IRR'),
    ).resolves.toEqual({ ok: true });
    expect(budget.createPlan).toHaveBeenCalledWith('user-1', 15000000, 'IRR');
  });

  it('rejects missing budget or currency', () => {
    expect(() =>
      controller.plan({ user: { id: 'user-1' } }, undefined, 'USD'),
    ).toThrow();
    expect(() =>
      controller.plan({ user: { id: 'user-1' } }, '10', undefined),
    ).toThrow();
  });

  it('passes user, servings and country into meal planning', async () => {
    mealPlanning.createMealPlan.mockResolvedValue({ generatedDeterministically: true });
    await expect(
      controller.mealPlan({ user: { id: 'user-1' } }, '4', 'JP'),
    ).resolves.toEqual({ generatedDeterministically: true });
    expect(mealPlanning.createMealPlan).toHaveBeenCalledWith('user-1', 4, 'JP');
  });
});
