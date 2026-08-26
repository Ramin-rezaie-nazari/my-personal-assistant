import { Injectable } from '@nestjs/common';
import { HouseholdItemNormalizerService } from './household-item-normalizer.service';

export type ShoppingGlobalContext = {
  countryCode: string;
  currency: string;
  locale?: string;
  timezone?: string;
  direction: 'ltr' | 'rtl';
};

@Injectable()
export class ShoppingGlobalContextService {
  constructor(private readonly normalizer: HouseholdItemNormalizerService) {}

  normalize(context: Partial<ShoppingGlobalContext> = {}): ShoppingGlobalContext {
    const countryCode = (context.countryCode ?? '').trim().toUpperCase();
    const currency = (context.currency ?? defaultCurrency(countryCode)).trim().toUpperCase();
    return {
      countryCode,
      currency,
      locale: context.locale?.trim() || undefined,
      timezone: context.timezone?.trim() || undefined,
      direction: rtlCountries.has(countryCode) ? 'rtl' : context.direction ?? 'ltr',
    };
  }

  normalizeItem(quantity: number, unit: string) {
    return this.normalizer.normalizeQuantity(quantity, unit);
  }
}

const rtlCountries = new Set(['IR', 'AF', 'IQ', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'JO', 'LB', 'SY', 'PS']);

function defaultCurrency(countryCode: string): string {
  const values: Record<string, string> = {
    IR: 'IRR',
    US: 'USD',
    CA: 'CAD',
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    AE: 'AED',
    SA: 'SAR',
    TR: 'TRY',
    IN: 'INR',
    AU: 'AUD',
    JP: 'JPY',
  };
  return values[countryCode] ?? 'USD';
}
