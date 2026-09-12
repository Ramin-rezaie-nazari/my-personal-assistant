import { LocalIntelligenceProvider } from './local-intelligence.provider';

describe('LocalIntelligenceProvider', () => {
  it('returns a budget-planning response for the local food-budget intent', async () => {
    const language = {
      understand: jest.fn().mockReturnValue({
        intent: 'PLAN_FOOD_BUDGET',
        confidence: 0.98,
        normalizedText: 'بودجه غذا',
        entities: { budgetAmount: 15000000, budgetCurrency: 'IRT' },
      }),
    };
    const provider = new LocalIntelligenceProvider(language as never);

    await expect(
      provider.generate({ input: 'برای غذا ۱۵ میلیون بودجه دارم' } as never),
    ).resolves.toEqual({
      providerId: 'local-core',
      text: 'حتماً. بودجه غذا رو با اطلاعات موجود و قیمت‌های قابل‌اعتماد برنامه‌ریزی می‌کنم.',
    });
  });

  it('remains deterministic and does not require an external provider', async () => {
    const language = {
      understand: jest.fn().mockReturnValue({
        intent: 'UNKNOWN',
        confidence: 0,
        normalizedText: 'hello',
        entities: {},
      }),
    };
    const provider = new LocalIntelligenceProvider(language as never);

    await expect(provider.isAvailable()).resolves.toBe(true);
    await expect(provider.generate({ input: 'hello' } as never)).resolves.toMatchObject({
      providerId: 'local-core',
    });
    expect(language.understand).toHaveBeenCalledWith('hello');
  });
});
