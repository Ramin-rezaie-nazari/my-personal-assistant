import { GlobalCountryFinanceService } from './global-country-finance.service';

describe('GlobalCountryFinanceService', () => {
  const service = new GlobalCountryFinanceService();

  it('covers the complete 195-country market set', () => {
    const countries = service.getSupportedCountryCodes();
    expect(countries).toHaveLength(195);
    expect(new Set(countries).size).toBe(195);
  });

  it('uses the local currency for Japan', () => {
    expect(service.getCountryCurrency('jp')).toEqual({
      countryCode: 'JP',
      currencyCode: 'JPY',
      fractionDigits: 2,
    });
  });

  it('keeps Iran in its source-native Rial representation', () => {
    expect(service.getCountryCurrency('IR')?.currencyCode).toBe('IRR');
  });

  it('rejects unknown country codes instead of guessing a currency', () => {
    expect(service.getFinanceContext('ZZ')).toBeNull();
  });
});
