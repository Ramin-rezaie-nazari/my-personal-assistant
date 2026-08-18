import { PersonalContextService } from './personal-context.service';

describe('PersonalContextService', () => {
  const storedSettings = {
    languageTag: 'fa-IR',
    countryCode: 'IR',
    currencyCode: 'IRR',
    measurementSystem: 'metric' as const,
    timezone: 'Asia/Tehran',
    globalization: { languageTag: 'fa-IR', countryCode: 'IR', currencyCode: 'IRR', measurementSystem: 'metric', timezone: 'Asia/Tehran' },
    voiceProfile: { id: 'fa-IR', languageCode: 'fa', accent: 'tehran', direction: 'rtl' as const },
  };

  it('assembles user, conversation, nutrition, life and persistent global context', async () => {
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
    const conversation = { turns: [], lastUserMessage: undefined, lastAssistantMessage: undefined, lastAction: undefined };
    const nutrition = { dateKey: '2026-08-17', meals: { calories: 1800, protein: 120 } };
    const life = { goals: { active: 1 }, fitness: { disciplines: ['gym'] } };

    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(userRow) },
    } as any;
    const conversationService = { get: jest.fn().mockResolvedValue(conversation) } as any;
    const nutritionService = { getDailySummary: jest.fn().mockResolvedValue(nutrition) } as any;
    const lifeService = { getToday: jest.fn().mockResolvedValue(life) } as any;
    const globalizationService = { resolve: jest.fn() } as any;
    const voiceService = { resolve: jest.fn() } as any;
    const globalSettingsService = { get: jest.fn().mockResolvedValue(storedSettings) } as any;

    const service = new PersonalContextService(
      prisma,
      conversationService,
      nutritionService,
      lifeService,
      globalizationService,
      voiceService,
      globalSettingsService,
    );

    await expect(
      service.build({
        userId: 'u1',
        input: 'امروز چقدر پروتئین گرفتم؟',
        dateKey: '2026-08-17',
      }),
    ).resolves.toMatchObject({
      user,
      globalization: storedSettings.globalization,
      voice: { profile: { id: 'fa-IR' }, accent: 'tehran' },
      globalSettings: storedSettings,
      dateKey: '2026-08-17',
      request: { input: 'امروز چقدر پروتئین گرفتم؟' },
      conversation,
      nutrition,
      life,
    });

    expect(globalSettingsService.get).toHaveBeenCalledWith('u1');
    expect(globalizationService.resolve).not.toHaveBeenCalled();
    expect(voiceService.resolve).not.toHaveBeenCalled();
  });

  it('applies per-request country and voice overrides without mutating persisted settings', async () => {
    const globalSettings = { ...storedSettings };
    const globalizationOverride = { ...storedSettings.globalization, countryCode: 'ES', currencyCode: 'EUR', foodRegion: 'ES' };
    const voiceOverride = { profile: { ...storedSettings.voiceProfile, id: 'es-MX', languageCode: 'es', accent: 'mexican' }, accent: 'mexican' };

    const service = new PersonalContextService(
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
      { get: jest.fn().mockResolvedValue({ turns: [] }) } as any,
      { getDailySummary: jest.fn().mockResolvedValue({}) } as any,
      { getToday: jest.fn().mockResolvedValue({}) } as any,
      { resolve: jest.fn().mockReturnValue(globalizationOverride) } as any,
      { resolve: jest.fn().mockReturnValue(voiceOverride) } as any,
      { get: jest.fn().mockResolvedValue(globalSettings) } as any,
    );

    const result = await service.build({ userId: 'u1', countryCode: 'ES', voiceId: 'es-MX' });

    expect(result.globalization).toMatchObject({ countryCode: 'ES' });
    expect(result.voice.profile.id).toBe('es-MX');
  });

  it('uses the current UTC date key when none is supplied', async () => {
    const service = new PersonalContextService(
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
      { get: jest.fn().mockResolvedValue({ turns: [] }) } as any,
      { getDailySummary: jest.fn().mockResolvedValue({}) } as any,
      { getToday: jest.fn().mockResolvedValue({}) } as any,
      { resolve: jest.fn() } as any,
      { resolve: jest.fn() } as any,
      { get: jest.fn().mockResolvedValue(storedSettings) } as any,
    );

    const result = await service.build({ userId: 'u1' });
    const expected = new Date().toISOString().slice(0, 10);

    expect(result.dateKey).toBe(expected);
  });
});
