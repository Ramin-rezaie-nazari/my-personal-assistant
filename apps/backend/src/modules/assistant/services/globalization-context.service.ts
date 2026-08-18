import { Injectable } from '@nestjs/common';

export type MeasurementSystem = 'metric' | 'us-customary' | 'uk-imperial';

export type GlobalizationContextRequest = {
  languageTag?: string;
  countryCode?: string;
  currencyCode?: string;
  measurementSystem?: MeasurementSystem;
  timezone?: string;
};

export type GlobalizationContext = {
  languageTag: string;
  languageCode: string;
  countryCode: string | null;
  currencyCode: string | null;
  measurementSystem: MeasurementSystem;
  timezone: string;
  direction: 'ltr' | 'rtl';
  foodRegion: string | null;
};

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_TIMEZONE = 'UTC';

const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur', 'ps', 'ku']);

const US_CUSTOMARY_COUNTRIES = new Set(['US', 'LR', 'MM']);
const UK_IMPERIAL_COUNTRIES = new Set(['GB']);

const COUNTRY_DEFAULT_CURRENCIES: Record<string, string> = {
  AE: 'AED',
  AU: 'AUD',
  CA: 'CAD',
  CN: 'CNY',
  DE: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  GB: 'GBP',
  IN: 'INR',
  IR: 'IRR',
  IT: 'EUR',
  JP: 'JPY',
  KR: 'KRW',
  SA: 'SAR',
  TR: 'TRY',
  US: 'USD',
};

@Injectable()
export class GlobalizationContextService {
  resolve(request: GlobalizationContextRequest = {}): GlobalizationContext {
    const languageTag = this.canonicalizeLocale(request.languageTag, request.countryCode);
    const languageCode = languageTag.split('-')[0]?.toLowerCase() || 'en';
    const countryCode = this.normalizeCountry(request.countryCode) ?? this.countryFromLocale(languageTag);
    const currencyCode = this.normalizeCurrency(request.currencyCode)
      ?? (countryCode ? COUNTRY_DEFAULT_CURRENCIES[countryCode] ?? null : null);
    const measurementSystem = request.measurementSystem
      ?? this.measurementSystemForCountry(countryCode);

    return {
      languageTag,
      languageCode,
      countryCode,
      currencyCode,
      measurementSystem,
      timezone: request.timezone || DEFAULT_TIMEZONE,
      direction: RTL_LANGUAGES.has(languageCode) ? 'rtl' : 'ltr',
      foodRegion: countryCode,
    };
  }

  private canonicalizeLocale(languageTag?: string, countryCode?: string): string {
    const requested = languageTag?.trim() || '';
    const normalizedCountry = this.normalizeCountry(countryCode);

    try {
      if (requested) {
        const [canonical] = Intl.getCanonicalLocales(requested);
        if (canonical && this.isSupportedLocale(canonical)) return canonical;
      }
    } catch {
      // Fall through to a safe locale.
    }

    if (normalizedCountry) {
      try {
        const [canonical] = Intl.getCanonicalLocales(`en-${normalizedCountry}`);
        if (canonical && this.isSupportedLocale(canonical)) return canonical;
      } catch {
        // Fall through to the global default.
      }
    }

    return DEFAULT_LOCALE;
  }

  private isSupportedLocale(languageTag: string): boolean {
    const requestedLanguage = new Intl.Locale(languageTag).language.toLowerCase();

    try {
      const resolved = new Intl.DateTimeFormat(languageTag).resolvedOptions().locale;
      const resolvedLanguage = new Intl.Locale(resolved).language.toLowerCase();
      if (requestedLanguage !== resolvedLanguage) return false;

      const region = this.countryFromLocale(languageTag);
      if (!region) return true;

      const resolvedLocale = new Intl.Locale(resolved);
      return resolvedLocale.region?.toUpperCase() === region;
    } catch {
      return false;
    }
  }

  private normalizeCountry(value?: string): string | null {
    const country = value?.trim().toUpperCase();
    return country && /^[A-Z]{2}$/.test(country) ? country : null;
  }

  private normalizeCurrency(value?: string): string | null {
    const currency = value?.trim().toUpperCase();
    return currency && /^[A-Z]{3}$/.test(currency) ? currency : null;
  }

  private countryFromLocale(languageTag: string): string | null {
    const parts = languageTag.split('-');
    const region = parts.find((part) => /^[A-Z]{2}$/.test(part));
    return region ?? null;
  }

  private measurementSystemForCountry(countryCode: string | null): MeasurementSystem {
    if (countryCode && US_CUSTOMARY_COUNTRIES.has(countryCode)) return 'us-customary';
    if (countryCode && UK_IMPERIAL_COUNTRIES.has(countryCode)) return 'uk-imperial';
    return 'metric';
  }
}
