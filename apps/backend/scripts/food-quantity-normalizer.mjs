const UNITS = new Map([
  ['ml', 'ml'], ['milliliter', 'ml'], ['milliliters', 'ml'], ['میلی لیتر', 'ml'],
  ['l', 'l'], ['liter', 'l'], ['liters', 'l'], ['لیتر', 'l'],
  ['g', 'g'], ['gram', 'g'], ['grams', 'g'], ['گرم', 'g'],
  ['kg', 'kg'], ['kilogram', 'kg'], ['kilograms', 'kg'], ['کیلو', 'kg'], ['کیلوگرم', 'kg'],
  ['oz', 'oz'], ['ounce', 'oz'], ['ounces', 'oz'],
  ['lb', 'lb'], ['lbs', 'lb'], ['pound', 'lb'], ['pounds', 'lb'],
  ['cup', 'cup'], ['cups', 'cup'], ['فنجان', 'cup'], ['لیوان', 'cup'],
  ['tbsp', 'tbsp'], ['tablespoon', 'tbsp'], ['tablespoons', 'tbsp'], ['قاشق غذاخوری', 'tbsp'],
  ['tsp', 'tsp'], ['teaspoon', 'tsp'], ['teaspoons', 'tsp'], ['قاشق چایخوری', 'tsp'],
]);

const FRACTIONS = { '¼': .25, '½': .5, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };
const UNIT_ALTERNATION = [...UNITS.keys()]
  .sort((a, b) => b.length - a.length)
  .map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

function normalizeFractionSlash(value) {
  return String(value || '').replace(/⁄/g, '/');
}

export function parseNumber(value) {
  const s = normalizeFractionSlash(value).trim();
  if (FRACTIONS[s] != null) return FRACTIONS[s];
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    return denominator ? Number(mixed[1]) + Number(mixed[2]) / denominator : null;
  }
  if (/^\d+\/\d+$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : null;
  }
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  return null;
}

export function normalizeQuantity(input) {
  const raw = String(input || '').trim();
  const normalizedRaw = normalizeFractionSlash(raw);
  const numberMatch = normalizedRaw.match(/^\s*(\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+(?:\.\d+)?)/u);
  if (!numberMatch) return { raw, quantity: null, unit: null, remainder: raw, confidence: 0 };

  const quantityToken = numberMatch[1];
  const quantity = parseNumber(quantityToken);
  if (quantity == null) return { raw, quantity: null, unit: null, remainder: raw, confidence: 0 };

  const afterNumber = normalizedRaw.slice(numberMatch[0].length).trimStart();

  // Protect dimensions such as "1/2-inch pieces" and "1 1/2-inch-thick".
  // These are preparation/shape descriptors, not the recipe quantity.
  if (/^(?:[-–—]\s*)?inch(?:es)?\b/i.test(afterNumber) || /^['’\"]\s*(?:-|to|$)/i.test(afterNumber)) {
    return { raw, quantity: null, unit: null, remainder: raw, confidence: 0 };
  }

  const unitPattern = new RegExp(`^(${UNIT_ALTERNATION})(?=\\s|$)`, 'iu');
  const unitMatch = afterNumber.match(unitPattern);
  if (unitMatch) {
    const unitKey = unitMatch[1].toLowerCase();
    return {
      raw,
      quantity,
      unit: UNITS.get(unitKey) || null,
      remainder: afterNumber.slice(unitMatch[0].length).trim(),
      confidence: 1,
    };
  }

  return { raw, quantity, unit: null, remainder: afterNumber, confidence: 0.7 };
}

export function convertToBase(quantity, unit) {
  if (quantity == null || !unit) return null;
  const factors = { ml: 1, l: 1000, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 };
  return factors[unit] != null
    ? { value: quantity * factors[unit], base_unit: unit === 'l' || unit === 'ml' ? 'ml' : 'g' }
    : null;
}
