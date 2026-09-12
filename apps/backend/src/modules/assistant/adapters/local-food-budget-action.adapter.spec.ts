import { LocalFoodBudgetActionAdapter } from './local-food-budget-action.adapter';

describe('LocalFoodBudgetActionAdapter', () => {
  it('executes a budget plan from parsed local budget entities', async () => {
    const registry = { register: jest.fn() };
    const budget = {
      createPlan: jest.fn().mockResolvedValue({
        budget: 15000000,
        currency: 'IRT',
        generatedDeterministically: true,
      }),
    };
    const adapter = new LocalFoodBudgetActionAdapter(
      registry as never,
      budget as never,
    );

    adapter.onModuleInit();
    const registered = registry.register.mock.calls[0][0];
    const candidate = { action: 'plan_food_budget' } as never;

    expect(registered.supports(candidate)).toBe(true);
    await expect(
      registered.execute(candidate, {
        userId: 'user-1',
        localUnderstanding: {
          entities: {
            budgetAmount: 15000000,
            budgetCurrency: 'IRT',
          },
        },
      }),
    ).resolves.toMatchObject({
      budget: 15000000,
      currency: 'IRT',
      generatedDeterministically: true,
    });

    expect(budget.createPlan).toHaveBeenCalledWith(
      'user-1',
      15000000,
      'IRT',
    );
  });

  it('blocks execution when parsed budget context is incomplete', async () => {
    const registry = { register: jest.fn() };
    const budget = { createPlan: jest.fn() };
    const adapter = new LocalFoodBudgetActionAdapter(
      registry as never,
      budget as never,
    );

    adapter.onModuleInit();
    const registered = registry.register.mock.calls[0][0];

    await expect(
      registered.execute(
        { action: 'plan_food_budget' } as never,
        {
          userId: 'user-1',
          localUnderstanding: { entities: { budgetAmount: 10 } },
        },
      ),
    ).resolves.toEqual({
      status: 'blocked_missing_budget_context',
      required: ['budgetAmount', 'budgetCurrency'],
    });
    expect(budget.createPlan).not.toHaveBeenCalled();
  });
});
