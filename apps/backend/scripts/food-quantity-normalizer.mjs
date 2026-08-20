const UNITS = new Map([
  ['ml', 'ml'], ['milliliter', 'ml'], ['milliliters', 'ml'], ['میلی لیتر', 'ml'],
  ['l', 'l'], ['liter', 'l'], ['liters', 'l'], ['لیتر', 'l'], ['لیتر', 'l'],
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
const SIZE_UNITS = 'ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|ml|milliliter|milliliters|liter|liters';
const PACKAGE_WORDS = 'package|packages|pkg|bag|bags|box|boxes|can|cans|jar|jars|bottle|bottles|carton|cartons';
const PACKAGE_MODIFIERS = 'chilled|well chilled|fresh|frozen|cold|hot';

function normalizeFractionSlash(value) {
  return String(value || '').replace(/⁄/g, '/');
}

function unicodeFractionValue(value) {
  const fraction = String(value || '').trim();
  return FRACTIONS[fraction] ?? null;
}

function parseRangeToken(value) {
  const normalized = normalizeFractionSlash(value).trim();
  const range = normalized.match(/^(.+?)\s*(?:[-–—]|\bto\b)\s*(.+)$/iu);
  if (!range) {
    const single = parseNumber(normalized);
    return single == null ? null : { min: single, max: single, token: normalized };
  }
  const min = parseNumber(range[1]);
  const max = parseNumber(range[2]);
  if (min == null || max == null) return null;
  return { min, max, token: normalized };
}

export function parseNumber(value) {
  const s = normalizeFractionSlash(value).trim();
  if (FRACTIONS[s] != null) return FRACTIONS[s];
  const unicodeMixed = s.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/u);
  if (unicodeMixed) return Number(unicodeMixed[1]) + unicodeFractionValue(unicodeMixed[2]);
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

const NUMBER_TOKEN = '(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\s*[¼½¾⅓⅔⅛⅜⅝⅞]|[¼½¾⅓⅔⅛⅜⅝⅞]|\\d+(?:\\.\\d+)?)';

function parseLeadingNumber(text) {
  const normalized = normalizeFractionSlash(text);
  const rangeMatch = normalized.match(new RegExp(`^\\s*(${NUMBER_TOKEN})(?:\\s*(?:[-–—]|\\bto\\b)\\s*(${NUMBER_TOKEN}))?`, 'iu'));
  if (!rangeMatch) return null;
  const first = parseNumber(rangeMatch[1]);
  const second = rangeMatch[2] ? parseNumber(rangeMatch[2]) : first;
  if (first == null || second == null) return null;
  return {
    token: rangeMatch[0].trim(),
    length: rangeMatch[0].length,
    quantity: first,
    quantity_min: Math.min(first, second),
    quantity_max: Math.max(first, second),
    is_range: rangeMatch[2] != null,
  };
}

export function normalizeQuantity(input) {
  const raw = String(input || '').trim();
  const normalizedRaw = normalizeFractionSlash(raw);
  const leading = parseLeadingNumber(normalizedRaw);
  if (!leading) return { raw, quantity: null, unit: null, remainder: raw, confidence: 0 };

  const afterNumber = normalizedRaw.slice(leading.length).trimStart();

  const packageSizePattern = new RegExp(
    `^(?<size>${NUMBER_TOKEN}` +
      `(?:\\s*(?:[-–—]|to)\\s*${NUMBER_TOKEN})?` +
      `)\\s*-?\\s*(?<sizeUnit>${SIZE_UNITS})(?:\\b|(?=\\s|-))` +
      `(?:\\s+(?:(?<modifier>${PACKAGE_MODIFIERS})\\s+)?(?<package>${PACKAGE_WORDS})(?:\\b|(?=\\s)))?`,
    'iu',
  );
  const packageSize = afterNumber.match(packageSizePattern);
  if (packageSize) {
    const remainder = afterNumber.slice(packageSize[0].length).trimStart();
    const parsedSize = packageSize.groups?.size ? parseRangeToken(packageSize.groups.size) : null;
    return {
      raw,
      quantity: leading.quantity,
      quantity_min: leading.quantity_min,
      quantity_max: leading.quantity_max,
      is_range: leading.is_range,
      unit: null,
      remainder,
      package_size: packageSize.groups?.size || null,
      package_size_min: parsedSize?.min ?? null,
      package_size_max: parsedSize?.max ?? null,
      package_size_unit: packageSize.groups?.sizeUnit || null,
      package_type: packageSize.groups?.package || null,
      package_modifier: packageSize.groups?.modifier || null,
      confidence: 0.98,
    };
  }

  if (/^(?:[-–—]\s*)?inch(?:es)?\b/i.test(afterNumber) || /^['’\"]\s*(?:-|to|$)/i.test(afterNumber)) {
    return { raw, quantity: null, quantity_min: null, quantity_max: null, unit: null, remainder: raw, confidence: 0 };
  }

  const unitPattern = new RegExp(`^(${UNIT_ALTERNATION})(?=\\s|$)`, 'iu');
  const unitMatch = afterNumber.match(unitPattern);
  if (unitMatch) {
    const unitKey = unitMatch[1].toLowerCase();
    return {
      raw,
      quantity: leading.quantity,
      quantity_min: leading.quantity_min,
      quantity_max: leading.quantity_max,
      is_range: leading.is_range,
      unit: UNITS.get(unitKey) || null,
      remainder: afterNumber.slice(unitMatch[0].length).trim(),
      confidence: 1,
    };
  }

  return {
    raw,
    quantity: leading.quantity,
    quantity_min: leading.quantity_min,
    quantity_max: leading.quantity_max,
    is_range: leading.is_range,
    unit: null,
    remainder: afterNumber,
    confidence: 0.7,
  };
}

export function convertToBase(quantity, unit) {
  if (quantity == null || !unit) return null;
  const factors = { ml: 1, l: 1000, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 };
  return factors[unit] != null
    ? { value: quantity * factors[unit], base_unit: unit === 'l' || unit === 'ml' ? 'ml' : 'g' }
    : null;
}
