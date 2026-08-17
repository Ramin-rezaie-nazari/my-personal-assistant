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
        return {
          intent: 'UNKNOWN',
          entities: {},
          confidence: 0,
          normalizedText: input,
        };
      }),
    } as any;
    return new LocalIntelligenceCoreService(language), language;
  };

  it('builds a nutrition response from compact user context', async () => {
    const [service] = [makeService()[0]];
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
    });
  });

  it('uses remaining calories for meal recommendations when available', async () => {
    const [service] = [makeService()[0]];
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
    });
  });

  it('builds a deterministic lightweight plan without an LLM', async () => {
    const [service] = [makeService()[0]];
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
    const [service] = [makeService()[0]];
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
});
