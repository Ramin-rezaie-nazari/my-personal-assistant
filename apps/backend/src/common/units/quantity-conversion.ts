export type ComparableUnitKind = 'mass' | 'volume' | 'count';

export type NormalizedQuantity = {
  kind: ComparableUnitKind;
  value: number;
};

export function normalizeQuantity(quantity: number, unit: string): NormalizedQuantity | null {
  const normalized = unit.trim().toLowerCase();
  if (['g', 'gr', 'gram', 'grams', 'گرم'].includes(normalized)) return { kind: 'mass', value: quantity };
  if (['kg', 'kilogram', 'kilograms', 'کیلو'].includes(normalized)) return { kind: 'mass', value: quantity * 1000 };
  if (['mg', 'milligram', 'milligrams'].includes(normalized)) return { kind: 'mass', value: quantity / 1000 };
  if (['oz', 'ounce', 'ounces'].includes(normalized)) return { kind: 'mass', value: quantity * 28.349523125 };
  if (['lb', 'lbs', 'pound', 'pounds'].includes(normalized)) return { kind: 'mass', value: quantity * 453.59237 };
  if (['ml', 'milliliter', 'milliliters'].includes(normalized)) return { kind: 'volume', value: quantity };
  if (['l', 'liter', 'liters'].includes(normalized)) return { kind: 'volume', value: quantity * 1000 };
  if (['piece', 'pieces', 'pcs', 'count', 'عدد'].includes(normalized)) return { kind: 'count', value: quantity };
  return null;
}

export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number | null {
  const source = normalizeQuantity(quantity, fromUnit);
  const target = normalizeQuantity(1, toUnit);
  if (!source || !target || source.kind !== target.kind || target.value <= 0) return null;
  return Number((source.value / target.value).toFixed(3));
}

export function convertUnitPrice(
  unitPrice: number,
  priceUnit: string,
  targetQuantity: number,
  targetUnit: string,
): number | null {
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(targetQuantity) || targetQuantity <= 0) return null;
  const source = normalizeQuantity(1, priceUnit);
  const target = normalizeQuantity(targetQuantity, targetUnit);
  if (!source || !target || source.kind !== target.kind || source.value <= 0) return null;
  return Number((unitPrice * (target.value / source.value)).toFixed(2));
}
