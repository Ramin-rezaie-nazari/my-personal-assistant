import { Injectable } from '@nestjs/common';

export type CanonicalUnit =
  | 'mg'
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'pcs';

const UNIT_ALIASES: Record<string, CanonicalUnit> = {
  mg: 'mg',
  milligram: 'mg',
  milligrams: 'mg',
  میلی‌گرم: 'mg',
  میلیگرم: 'mg',
  g: 'g',
  gram: 'g',
  grams: 'g',
  گرم: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  کیلو: 'kg',
  کیلوگرم: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  میلی‌لیتر: 'ml',
  میلیلیتر: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  لیتر: 'l',
  pcs: 'pcs',
  pc: 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  unit: 'pcs',
  units: 'pcs',
  each: 'pcs',
  عدد: 'pcs',
  عددی: 'pcs',
};

const UNIT_GROUP: Record<CanonicalUnit, 'mass' | 'volume' | 'count'> = {
  mg: 'mass',
  g: 'mass',
  kg: 'mass',
  ml: 'volume',
  l: 'volume',
  pcs: 'count',
};

const TO_BASE: Record<CanonicalUnit, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  pcs: 1,
};

@Injectable()
export class HouseholdItemNormalizerService {
  canonicalizeProductKey(value: string): string {
    return value
      .normalize('NFKC')
      .trim()
      .toLocaleLowerCase()
      .replace(/[\u200c\u200d]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?،؛]+$/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  normalizeUnit(value: string): CanonicalUnit {
    const key = value.normalize('NFKC').trim().toLocaleLowerCase();
    return UNIT_ALIASES[key] ?? 'pcs';
  }

  normalizeQuantity(quantity: number, unit: string) {
    const normalizedUnit = this.normalizeUnit(unit);
    return { quantity, unit: normalizedUnit };
  }

  canConvert(from: string, to: string) {
    const a = this.normalizeUnit(from);
    const b = this.normalizeUnit(to);
    return UNIT_GROUP[a] === UNIT_GROUP[b];
  }

  convert(quantity: number, from: string, to: string) {
    const a = this.normalizeUnit(from);
    const b = this.normalizeUnit(to);
    if (UNIT_GROUP[a] !== UNIT_GROUP[b]) {
      throw new Error(`incompatible units: cannot convert ${a} to ${b}`);
    }
    return (quantity * TO_BASE[a]) / TO_BASE[b];
  }
}
