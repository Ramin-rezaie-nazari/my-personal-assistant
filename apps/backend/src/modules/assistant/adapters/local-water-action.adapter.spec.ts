import { LocalWaterActionAdapter } from './local-water-action.adapter';

describe('LocalWaterActionAdapter', () => {
  it('registers and executes an authenticated water logging action', async () => {
    const dailyLog = { dateKey: '2026-08-17', waterMl: 750 };
    const dailyService = { addWater: jest.fn().mockResolvedValue(dailyLog) };
    const adapters = { register: jest.fn() };
    const service = new LocalWaterActionAdapter(dailyService as any, adapters as any);

    service.onModuleInit();

    const registered = adapters.register.mock.calls[0][0];
    expect(registered.actions).toEqual(['add_water']);
    expect(registered.supports({ action: 'add_water' } as any)).toBe(true);
    expect(registered.supports({ action: 'get_nutrition_summary' } as any)).toBe(false);

    await expect(
      registered.execute(
        { action: 'add_water' } as any,
        {
          userId: 'u1',
          dateKey: '2026-08-17',
          localUnderstanding: { entities: { waterAmountMl: 500 } },
        },
      ),
    ).resolves.toEqual({
      message: '500 میلی‌لیتر آب به امروزت اضافه شد.',
      amountMl: 500,
      dailyLog,
    });
    expect(dailyService.addWater).toHaveBeenCalledWith('u1', 500, '2026-08-17');
  });

  it('rejects execution without an authenticated user id or water amount', async () => {
    const dailyService = { addWater: jest.fn() };
    const service = new LocalWaterActionAdapter(dailyService as any, { register: jest.fn() } as any);

    await expect(service.execute({ action: 'add_water' } as any, {})).rejects.toThrow('user_id_missing');
    await expect(service.execute({ action: 'add_water' } as any, { userId: 'u1', localUnderstanding: { entities: {} } })).rejects.toThrow('water_amount_missing');
  });
});
