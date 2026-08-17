import { GlobalUserSettingsService } from './global-user-settings.service';

describe('GlobalUserSettingsService', () => {
  const voiceProfile = {
    id: 'fa-IR',
    languageCode: 'fa',
    languageName: 'Persian',
    accent: 'Tehran',
    direction: 'rtl' as const,
    offlineCapable: true,
  };

  it('reads persistent globalization facts and resolves a stable voice profile', async () => {
    const service = new GlobalUserSettingsService(
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            settings: { language: 'fa-IR', timezone: 'Asia/Tehran' },
          }),
        },
        userFact: {
          findMany: jest.fn().mockResolvedValue([
            { key: 'voiceProfile', value: 'fa-IR' },
            { key: 'measurementSystem', value: 'metric' },
            { key: 'currencyCode', value: 'IRR' },
            { key: 'countryCode', value: 'IR' },
          ]),
        },
      } as any,
      {
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
      } as any,
      {
        resolve: jest.fn().mockReturnValue({ profile: voiceProfile }),
      } as any,
    );

    await expect(service.get('u1')).resolves.toMatchObject({
      languageTag: 'fa-IR',
      countryCode: 'IR',
      currencyCode: 'IRR',
      measurementSystem: 'metric',
      timezone: 'Asia/Tehran',
      voiceProfile: { id: 'fa-IR' },
    });
  });

  it('persists an updated global preference set atomically', async () => {
    const tx = jest.fn().mockResolvedValue([]);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          settings: { language: 'en-US', timezone: 'UTC' },
        }),
      },
      userFact: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockReturnValue('delete'),
        create: jest.fn().mockReturnValue('create'),
      },
      userSettings: {
        upsert: jest.fn().mockReturnValue('settings'),
      },
      $transaction: tx,
    };
    const globalization = {
      resolve: jest.fn().mockReturnValue({
        languageTag: 'es-ES',
        languageCode: 'es',
        countryCode: 'ES',
        currencyCode: 'EUR',
        measurementSystem: 'metric',
        timezone: 'Europe/Madrid',
        direction: 'ltr',
        foodRegion: 'ES',
      }),
    };
    const voice = {
      resolve: jest.fn().mockReturnValue({ profile: { ...voiceProfile, id: 'es-ES' } }),
    };
    const service = new GlobalUserSettingsService(prisma as any, globalization as any, voice as any);

    const result = await service.update('u1', {
      languageTag: 'es-ES',
      countryCode: 'ES',
      currencyCode: 'EUR',
      measurementSystem: 'metric',
      timezone: 'Europe/Madrid',
      voiceProfile: 'es-ES',
    });

    expect(tx).toHaveBeenCalledTimes(1);
    expect(prisma.userSettings.upsert).toHaveBeenCalled();
    expect(result.globalization.countryCode).toBe('ES');
    expect(result.voiceProfile.id).toBe('es-ES');
  });

  it('rejects an explicitly unsupported voice profile', async () => {
    const service = new GlobalUserSettingsService(
      {
        user: { findUnique: jest.fn().mockResolvedValue({ settings: { language: 'en-US', timezone: 'UTC' } }) },
        userFact: { findMany: jest.fn().mockResolvedValue([]) },
      } as any,
      { resolve: jest.fn().mockReturnValue({ languageTag: 'en-US', countryCode: 'US', currencyCode: 'USD', measurementSystem: 'us-customary', timezone: 'UTC' }) } as any,
      { resolve: jest.fn().mockReturnValue({ profile: { id: 'en-US' } }) } as any,
    );

    await expect(service.update('u1', { voiceProfile: 'does-not-exist' })).rejects.toThrow(
      'unsupported_voice_profile',
    );
  });
});
