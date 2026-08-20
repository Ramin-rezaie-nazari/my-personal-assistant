function splitTopLevel(value, separatorPattern) {
  const text = String(value || '').trim();
  if (!text) return [];
  const out = [];
  let current = '';
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if ((ch === '"' || ch === "'") && (quote === null || quote === ch)) {
      quote = quote === ch ? null : ch;
      current += ch;
      continue;
    }
    if (quote === null) {
      if (ch === '(' || ch === '[') depth += 1;
      else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
      if (depth === 0 && separatorPattern.test(ch)) {
        const part = current.trim();
        if (part) out.push(part);
        current = '';
        continue;
      }
    }
    current += ch;
  }
  const last = current.trim();
  if (last) out.push(last);
  return out;
}

const NUMBER = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞]|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+(?:\.\d+)?)`;
const UNIT = String.raw`(?:ml|milliliters?|l|liters?|g|grams?|kg|kilograms?|oz|ounces?|lb|lbs|pounds?|cup|cups|tbsp|tablespoons?|tsp|teaspoons?)`;
const HAS_QUANTITY = new RegExp(`^\\s*(?:about\\s+|approximately\\s+|around\\s+|at\\s+least\\s+|up\\s+to\\s+)?${NUMBER}(?:\\s*(?:[-–—]|to)\\s*${NUMBER})?(?:\\s*${UNIT})?\\b`, 'iu');

function normalizeText(value) {
  return String(value || '')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/[-–—]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeEquipmentOrHeader(value) {
  return /^(?:equipment|accompaniments?|tools?|garnish|for serving)\s*:/i.test(value)
    || /^(?:a|an|one)\s+(?:9|12|18|[2-9])[-\s]?inch\b.*(?:dish|plate|cutter|pan|sheet|turntable|bowl|pot|mixer|slicer|thermometer)/i.test(value);
}

function splitSemicolon(value) {
  return splitTopLevel(value, /;/u).map(normalizeText).filter(Boolean);
}

function splitCommaCompound(value) {
  const parts = splitTopLevel(value, /,/u);
  if (parts.length < 3) return null;
  const quantityParts = parts.filter((part) => HAS_QUANTITY.test(part)).length;
  if (quantityParts < 2) return null;
  return parts.map(normalizeText).filter(Boolean);
}

export function splitSourcePart(value) {
  const source = normalizeText(value);
  if (!source) return [];
  const semicolonParts = splitSemicolon(source);
  if (semicolonParts.length > 1) return semicolonParts;
  if (looksLikeEquipmentOrHeader(source)) return [source];
  const commaParts = splitCommaCompound(source);
  if (commaParts) return commaParts;
  return [source];
}

export function sourcePartDecomposerSelfTest() {
  const cases = [
    ['Accompaniments: butter lettuce; thinly sliced garlic; packaged kimchi; steamed white rice', 4],
    ['chilled, 1 1/2 teaspoons agave syrup or honey, 1 1/2 tablespoons lemon juice, citrus wedges', 4],
    ['1 pound cantaloupe, rind and seeds removed, coarsely chopped', 1],
    ['450 g chicken breasts, boneless, skinless', 1],
    ['1 cup fresh breadcrumbs made from crustless French or country-style bread', 1],
    ['1 2-ounce package chocolate chips', 1],
  ];
  for (const [input, expectedLength] of cases) {
    const actual = splitSourcePart(input).length;
    if (actual !== expectedLength) throw new Error(`source-part decomposition failed: ${input} -> ${actual} != ${expectedLength}`);
  }
  return { status: 'pass', cases: cases.length };
}
