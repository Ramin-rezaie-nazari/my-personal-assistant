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
  میلی‌گرم: 'mg',
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
    const unit = UNIT_ALIASES[key];
    if (!unit) throw new Error(`Unsupported unit: ${value}`);
    return unit;
  }

  normalizeQuantity(quantity: number, unit: string): { quantity: number; unit: CanonicalUnit } {
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error('Quantity must be a finite non-negative number');
    }
    return { quantity, unit: this.normalizeUnit(unit) };
  }

  canConvert(fromUnit: string, toUnit: string): boolean {
    const from = this.normalizeUnit(fromUnit);
    const to = this.normalizeUnit(toUnit);
    return UNIT_GROUP[from] === UNIT_GROUP[to];
  }

  convert(quantity: number, fromUnit: string, toUnit: string): number {
    const from = this.normalizeUnit(fromUnit);
    const to = this.normalizeUnit(toUnit);
    if (UNIT_GROUP[from] !== UNIT_GROUP[to]) {
      throw new Error(`Incompatible units: ${from} -> ${to}`);
    }
    if (!Number.isFinite(quantity)) throw new Error('Quantity must be finite');
    return (quantity * TO_BASE[from]) / TO_BASE[to];
  }
}
