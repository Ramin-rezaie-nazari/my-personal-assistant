import { PersonalContextService } from './personal-context.service';

describe('PersonalContextService', () => {
  it('assembles user, conversation, nutrition, life, globalization and voice context', async () => {
    const userRow = {
      id: 'u1',
      firstName: 'Ramin',
      lastName: 'Rezaie',
      settings: { timezone: 'Asia/Tehran', language: 'fa-IR' },
    };
    const user = {
      id: 'u1',
      name: 'Ramin Rezaie',
      timezone: 'Asia/Tehran',
      language: 'fa-IR',
    };
    const conversation = {
      turns: [],
      lastUserMessage: undefined,
      lastAssistantMessage: undefined,
      lastAction: undefined,
    };
    const nutrition = {
      dateKey: '2026-08-17',
      meals: { calories: 1800, protein: 120 },
    };
    const life = { goals: { active: 1 }, fitness: { disciplines: ['gym'] } };

    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(userRow) },
    } as any;
    const conversationService = {
      get: jest.fn().mockResolvedValue(conversation),
    } as any;
    const nutritionService = {
      getDailySummary: jest.fn().mockResolvedValue(nutrition),
    } as any;
    const lifeService = {
      getToday: jest.fn().mockResolvedValue(life),
    } as any;
    const globalizationService = {
      resolve: jest.fn().mockReturnValue({
        languageTag: 'fa-IR',
        languageCode: 'fa',
        countryCode: 'IR',
        currencyCode: 'IRR',
        measurementSystem: 'metric',
        timezone: 'Asia/Tehran',
        direction: 'rtl',
        foodRegion: 'IR',
      }),
    } as any;
    const voiceService = {
      resolve: jest.fn().mockReturnValue({
        profile: { id: 'fa-IR', accent: 'tehran', languageCode: 'fa' },
        locale: { languageTag: 'fa-IR' },
        inputLanguage: 'fa',
        synthesisLanguage: 'fa',
        accent: 'tehran',
        direction: 'rtl',
      }),
    } as any;

    const service = new PersonalContextService(
      prisma,
      conversationService,
      nutritionService,
      lifeService,
      globalizationService,
      voiceService,
    );

    await expect(
      service.build({
        userId: 'u1',
        input: 'امروز چقدر پروتئین گرفتم؟',
        dateKey: '2026-08-17',
      }),
    ).resolves.toMatchObject({
      user,
      globalization: { languageTag: 'fa-IR', countryCode: 'IR' },
      voice: { profile: { id: 'fa-IR' }, accent: 'tehran' },
      dateKey: '2026-08-17',
      request: { input: 'امروز چقدر پروتئین گرفتم؟' },
      conversation,
      nutrition,
      life,
    });

    expect(globalizationService.resolve).toHaveBeenCalledWith({
      languageTag: 'fa-IR',
      countryCode: undefined,
      timezone: 'Asia/Tehran',
    });
    expect(voiceService.resolve).toHaveBeenCalledWith({
      languageTag: 'fa-IR',
      countryCode: 'IR',
      voiceId: undefined,
    });
  });

  it('uses the current UTC date key when none is supplied', async () => {
    const service = new PersonalContextService(
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
      { get: jest.fn().mockResolvedValue({ turns: [] }) } as any,
      { getDailySummary: jest.fn().mockResolvedValue({}) } as any,
      { getToday: jest.fn().mockResolvedValue({}) } as any,
      { resolve: jest.fn().mockReturnValue({ languageTag: 'en-US', countryCode: 'US' }) } as any,
      { resolve: jest.fn().mockReturnValue({ profile: { id: 'en-US' } }) } as any,
    );

    const result = await service.build({ userId: 'u1' });
    const expected = new Date().toISOString().slice(0, 10);

    expect(result.dateKey).toBe(expected);
  });
});
