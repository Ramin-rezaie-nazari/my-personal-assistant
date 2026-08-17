import { LocalIntelligenceCoreService } from './local-intelligence-core.service';

describe('LocalIntelligenceCoreService', () => {
  const makeService = () => {
    const language = {
      understand: jest.fn((input: string) => {
        if (input.includes('پروتئین')) {
          return {
            intent: 'GET_NUTRITION_SUMMARY',
            entities: {},
            confidence: 0.95,
            normalizedText: input,
          };
        }
        if (input.includes('چی بخور')) {
          return {
            intent: 'RECOMMEND_MEAL',
            entities: {},
            confidence: 0.94,
            normalizedText: input,
          };
        }
        if (input.includes('آب') || input.includes('لیتر')) {
          return {
            intent: 'ADD_WATER',
            entities: { waterAmountMl: 500 },
            confidence: 0.97,
            normalizedText: input,
          };
        }
        return {
          intent: 'UNKNOWN',
          entities: {},
          confidence: 0,
          normalizedText: input,
        };
      }),
    } as any;
    const runtime = {
      profile: jest.fn((signals?: { totalMemoryMb?: number; cpuCores?: number }) =>
        signals?.totalMemoryMb && signals.totalMemoryMb <= 2048
          ? {
              tier: 'tiny',
              maxContextTokens: 768,
              preferredModelClass: 'deterministic',
              allowVision: false,
              allowVoice: false,
            }
          : {
              tier: 'standard',
              maxContextTokens: 3072,
              preferredModelClass: 'small-local',
              allowVision: true,
              allowVoice: true,
            },
      ),
    } as any;
    return { service: new LocalIntelligenceCoreService(language, runtime), language, runtime };
  };

  it('builds a nutrition response from compact user context', async () => {
    const { service } = makeService();
    await expect(
      service.generate({
        input: 'پروتئین امروزمو بگو',
        task: 'text-generation',
        context: {
          nutrition: {
            meals: { calories: 1800, protein: 112 },
            waterMl: 900,
          },
        },
      }),
    ).resolves.toMatchObject({
      providerId: 'local-core',
      task: 'text-generation',
      text: 'تا اینجای امروز حدود 1800 کالری و 112 گرم پروتئین ثبت کردی.',
      source: 'contextual-template',
      runtimeTier: 'standard',
      modelClass: 'small-local',
    });
  });

  it('uses remaining calories for meal recommendations when available', async () => {
    const { service } = makeService();
    await expect(
      service.generate({
        input: 'برای شام چی بخورم؟',
        task: 'text-generation',
        context: {
          nutrition: { remaining: { calories: 620 } },
        },
      }),
    ).resolves.toMatchObject({
      text: expect.stringContaining('620 کالری'),
      source: 'contextual-template',
      runtimeTier: 'standard',
    });
  });

  it('builds a deterministic lightweight plan without an LLM', async () => {
    const { service } = makeService();
    await expect(
      service.generate({
        input: '۵۰۰ میلی‌لیتر آب خوردم',
        task: 'planning',
      }),
    ).resolves.toMatchObject({
      providerId: 'local-core',
      task: 'planning',
      text: expect.stringContaining('ثبت مقدار آب مصرف‌شده'),
      source: 'deterministic',
    });
  });

  it('keeps unknown requests lightweight and contextual instead of pretending to know', async () => {
    const { service } = makeService();
    await expect(
      service.generate({
        input: 'یه پیشنهاد برای امروز بده',
        task: 'text-generation',
        context: { life: { goals: { active: 2 } } },
      }),
    ).resolves.toMatchObject({
      text: expect.stringContaining('هدف‌های فعلیت'),
      confidence: 0.55,
    });
  });

  it('uses the device runtime signals to select a tiny tier on weak devices', async () => {
    const { service } = makeService();
    const result = await service.generate({
      input: 'یه پیشنهاد برای امروز بده',
      task: 'text-generation',
      context: {
        deviceRuntime: { totalMemoryMb: 2048, cpuCores: 2 },
      },
    });

    expect(result.runtimeTier).toBe('tiny');
    expect(result.modelClass).toBe('deterministic');
  });
});
