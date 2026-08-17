import { GlobalizationContextService } from './globalization-context.service';

describe('GlobalizationContextService', () => {
  const service = new GlobalizationContextService();

  it('normalizes Persian in Iran with Tehran-safe defaults', () => {
    expect(
      service.resolve({
        languageTag: 'fa',
        countryCode: 'ir',
        currencyCode: 'irr',
        timezone: 'Asia/Tehran',
      }),
    ).toEqual({
      languageTag: 'fa',
      languageCode: 'fa',
      countryCode: 'IR',
      currencyCode: 'IRR',
      measurementSystem: 'metric',
      timezone: 'Asia/Tehran',
      direction: 'rtl',
      foodRegion: 'IR',
    });
  });

  it('keeps a Spanish user in Spain tied to Spain rather than Iran-specific defaults', () => {
    expect(
      service.resolve({ languageTag: 'es-ES', countryCode: 'ES' }),
    ).toMatchObject({
      languageTag: 'es-ES',
      languageCode: 'es',
      countryCode: 'ES',
      currencyCode: 'EUR',
      measurementSystem: 'metric',
      direction: 'ltr',
      foodRegion: 'ES',
    });
  });

  it('uses US customary units for US users and respects an explicit currency override', () => {
    expect(
      service.resolve({
        languageTag: 'en-US',
        countryCode: 'US',
        currencyCode: 'CAD',
      }),
    ).toMatchObject({
      countryCode: 'US',
      currencyCode: 'CAD',
      measurementSystem: 'us-customary',
    });
  });

  it('supports explicit language, country, currency, units, and timezone independently', () => {
    expect(
      service.resolve({
        languageTag: 'de',
        countryCode: 'DE',
        currencyCode: 'CHF',
        measurementSystem: 'metric',
        timezone: 'Europe/Zurich',
      }),
    ).toMatchObject({
      languageTag: 'de',
      languageCode: 'de',
      countryCode: 'DE',
      currencyCode: 'CHF',
      measurementSystem: 'metric',
      timezone: 'Europe/Zurich',
    });
  });

  it('falls back safely for malformed locale inputs instead of crashing', () => {
    expect(service.resolve({ languageTag: 'not-a-real-locale' })).toMatchObject({
      languageTag: 'en-US',
      languageCode: 'en',
      countryCode: 'US',
      currencyCode: 'USD',
      measurementSystem: 'us-customary',
    });
  });
});
