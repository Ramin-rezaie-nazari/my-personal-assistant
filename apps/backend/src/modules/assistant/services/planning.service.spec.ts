import { PlanningService } from './planning.service';

describe('PlanningService', () => {
  const service = new PlanningService();

  it('carries deterministic local entities into actionable steps', async () => {
    const plan = await service.createPlan({
      clauses: ['برای ۴ نفر شام پیشنهاد بده'],
      intents: ['create'],
      confidence: 0.9,
      entities: {
        householdSize: 4,
        mealType: 'dinner',
        budgetAmount: 15_000_000,
        budgetCurrency: 'IRT',
      },
    });

    expect(plan.requiresClarification).toBe(false);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].entities).toEqual({
      householdSize: 4,
      mealType: 'dinner',
      budgetAmount: 15_000_000,
      budgetCurrency: 'IRT',
    });
  });

  it('still requires clarification for contradictory requests', async () => {
    const plan = await service.createPlan({
      clauses: ['اینو اضافه کن', 'بعد لغوش کن'],
      intents: ['create', 'cancel'],
      contradictions: ['create_and_cancel_same_turn'],
      confidence: 0.9,
    });

    expect(plan.requiresClarification).toBe(true);
    expect(plan.reason).toBe('conflicting_request');
  });
});
