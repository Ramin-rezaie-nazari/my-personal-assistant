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

export function parseNumber(value) {
  const s = String(value || '').trim();
  if (FRACTIONS[s] != null) return FRACTIONS[s];
  if (/^\d+\/\d+$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : null;
  }
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  const m = s.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (m) {
    const [a, b] = m[2].split('/').map(Number);
    return b ? Number(m[1]) + a / b : null;
  }
  return null;
}

export function normalizeQuantity(input) {
  const raw = String(input || '').trim();
  const numberMatch = raw.match(/^\s*(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])/u);
  if (!numberMatch) return { raw, quantity: null, unit: null, remainder: raw, confidence: 0 };

  const quantity = parseNumber(numberMatch[1]);
  if (quantity == null) return { raw, quantity: null, unit: null, remainder: raw, confidence: 0 };

  const afterNumber = raw.slice(numberMatch[0].length).trimStart();
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
