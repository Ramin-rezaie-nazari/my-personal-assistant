import { LocalNutritionActionAdapter } from './local-nutrition-action.adapter';

describe('LocalNutritionActionAdapter', () => {
  it('registers and executes the authenticated nutrition summary action', async () => {
    const summary = {
      dateKey: '2026-08-17',
      meals: { count: 2, calories: 900, protein: 60, carbs: 80, fat: 25 },
      goals: { calories: 2000, protein: 140, waterMl: 2500 },
    };
    const nutritionService = {
      getDailySummary: jest.fn().mockResolvedValue(summary),
    };
    const adapters = { register: jest.fn() };
    const service = new LocalNutritionActionAdapter(
      nutritionService as any,
      adapters as any,
    );

    service.onModuleInit();

    const registered = adapters.register.mock.calls[0][0];
    expect(registered.actions).toEqual(['get_nutrition_summary']);
    expect(
      registered.supports({ action: 'get_nutrition_summary' } as any),
    ).toBe(true);
    expect(registered.supports({ action: 'create_meal' } as any)).toBe(false);

    await expect(
      registered.execute(
        { action: 'get_nutrition_summary' } as any,
        { userId: 'u1', dateKey: '2026-08-17' },
      ),
    ).resolves.toEqual({
      message: 'خلاصه تغذیه امروزت آماده‌ست.',
      summary,
    });
    expect(nutritionService.getDailySummary).toHaveBeenCalledWith(
      'u1',
      '2026-08-17',
    );
  });

  it('rejects execution without an authenticated user id', async () => {
    const service = new LocalNutritionActionAdapter(
      { getDailySummary: jest.fn() } as any,
      { register: jest.fn() } as any,
    );

    await expect(
      (service as any).execute(
        { action: 'get_nutrition_summary' },
        {},
      ),
    ).rejects.toThrow('user_id_missing');
  });
});
