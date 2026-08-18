import { Injectable } from '@nestjs/common';
import {
  GLOBAL_COUNTRY_CURRENCIES,
  GlobalCountryCurrency,
} from '../data/global-country-currency';

@Injectable()
export class GlobalCountryFinanceService {
  getSupportedCountryCodes(): string[] {
    return Object.keys(GLOBAL_COUNTRY_CURRENCIES);
  }

  getCountryCurrency(countryCode: string): GlobalCountryCurrency | null {
    return GLOBAL_COUNTRY_CURRENCIES[countryCode.trim().toUpperCase()] ?? null;
  }

  getFinanceContext(countryCode: string) {
    const currency = this.getCountryCurrency(countryCode);
    if (!currency) return null;
    return {
      countryCode: currency.countryCode,
      currencyCode: currency.currencyCode,
      fractionDigits: currency.fractionDigits,
      priceIntelligencePolicy: {
        preserveLocalCurrency: true,
        convertOnlyForComparison: true,
        requireFreshFxRate: true,
      },
    } as const;
  }
}
