import { Injectable } from '@nestjs/common';

export type CanonicalCuisineFamily =
  | 'afghan'
  | 'arabian-gulf'
  | 'balkan'
  | 'bengali'
  | 'chinese'
  | 'european'
  | 'indian'
  | 'japanese'
  | 'korean'
  | 'latin-american'
  | 'levantine'
  | 'mediterranean'
  | 'persian'
  | 'south-east-asian'
  | 'west-african'
  | 'other';

const CUISINE_ALIASES: Record<string, CanonicalCuisineFamily> = {
  afghan: 'afghan',
  'arabian gulf': 'arabian-gulf',
  'gulf-arab': 'arabian-gulf',
  balkan: 'balkan',
  bengali: 'bengali',
  chinese: 'chinese',
  indian: 'indian',
  japanese: 'japanese',
  korean: 'korean',
  'latin american': 'latin-american',
  levantine: 'levantine',
  mediterranean: 'mediterranean',
  'persian': 'persian',
  'south east asian': 'south-east-asian',
  'south-east-asian': 'south-east-asian',
  'west african': 'west-african',
};

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[يى]/gu, 'ی')
    .replace(/[ك]/gu, 'ک')
    .replace(/\u200c/gu, ' ')
    .replace(/[–—]/gu, '-')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase();
}

@Injectable()
export class FoodContextNormalizationService {
  normalizeCuisineFamily(value: string | null | undefined): CanonicalCuisineFamily {
    const normalized = normalize(value ?? '');
    if (!normalized) return 'other';
    if (CUISINE_ALIASES[normalized]) return CUISINE_ALIASES[normalized];
    if (normalized.includes('persian') || normalized.includes('ایرانی')) return 'persian';
    if (normalized.includes('levant')) return 'levantine';
    if (normalized.includes('mediterranean')) return 'mediterranean';
    if (normalized.includes('korean')) return 'korean';
    if (normalized.includes('japanese')) return 'japanese';
    if (normalized.includes('chinese')) return 'chinese';
    return 'other';
  }

  normalizeCountryCode(value: string | null | undefined): string | null {
    const normalized = normalize(value ?? '').toUpperCase();
    return /^[A-Z]{2}$/u.test(normalized) ? normalized : null;
  }
}
