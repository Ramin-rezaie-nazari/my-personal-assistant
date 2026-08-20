export const FOOD_QUANTITY_NORMALIZER_VERSION = 'food-quantity-normalizer-v1';

const MASS_TO_G = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

const VOLUME_TO_ML = {
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  fl_oz: 29.5735295625,
  pint: 473.176473,
  quart: 946.352946,
  gallon: 3785.411784,
};

const COUNT_UNITS = new Set(['count', 'piece', 'package', 'can', 'bottle', 'jar', 'bag', 'bunch', 'sprig', 'slice', 'clove', 'stick']);

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value || '').trim();
  if (/^\d+\/\d+$/.test(text)) {
    const [a, b] = text.split('/').map(Number);
    return b ? a / b : null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeFoodQuantity(amount, unit) {
  const value = numeric(amount);
  const normalizedUnit = String(unit || '').toLowerCase().replace(/[- ]/g, '_');
  if (value == null || !normalizedUnit) {
    return { ok: false, version: FOOD_QUANTITY_NORMALIZER_VERSION, amount: value, unit: normalizedUnit || null, reason: 'invalid_quantity' };
  }

  if (normalizedUnit in MASS_TO_G) {
    return { ok: true, version: FOOD_QUANTITY_NORMALIZER_VERSION, amount: value, unit: normalizedUnit, dimension: 'mass', base_amount: value * MASS_TO_G[normalizedUnit], base_unit: 'g', conversion_confidence: .995 };
  }

  if (normalizedUnit in VOLUME_TO_ML) {
    const isApproximateCulinaryMeasure = ['tsp', 'tbsp', 'cup', 'pint', 'quart', 'gallon'].includes(normalizedUnit);
    return { ok: true, version: FOOD_QUANTITY_NORMALIZER_VERSION, amount: value, unit: normalizedUnit, dimension: 'volume', base_amount: value * VOLUME_TO_ML[normalizedUnit], base_unit: 'ml', conversion_confidence: isApproximateCulinaryMeasure ? .96 : .995 };
  }

  if (COUNT_UNITS.has(normalizedUnit)) {
    return { ok: true, version: FOOD_QUANTITY_NORMALIZER_VERSION, amount: value, unit: normalizedUnit, dimension: 'count', base_amount: value, base_unit: 'count', conversion_confidence: 1 };
  }

  return { ok: false, version: FOOD_QUANTITY_NORMALIZER_VERSION, amount: value, unit: normalizedUnit, reason: 'unsupported_unit' };
}

export function sameDimension(a, b) {
  return Boolean(a?.ok && b?.ok && a.dimension === b.dimension);
}

export function compareQuantities(a, b) {
  if (!sameDimension(a, b)) return { comparable: false, reason: 'different_or_unknown_dimension' };
  return { comparable: true, difference_in_base_units: Number((a.base_amount - b.base_amount).toFixed(6)), base_unit: a.base_unit, confidence: Math.min(a.conversion_confidence, b.conversion_confidence) };
}
