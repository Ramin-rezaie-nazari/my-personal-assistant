import { resolveFoodEntity as baseResolve, getEntityById, getEntityRelations, resolverIntegrity as baseIntegrity, FOOD_ENTITY_RESOLVER_VERSION as BASE_VERSION } from './food-entity-resolver-v2.mjs';

export const FOOD_ENTITY_RESOLVER_VERSION = 'food-entity-resolver-v3-final';

const UNITS = [
  ['milliliters', 'ml'], ['milliliter', 'ml'], ['liters', 'l'], ['liter', 'l'],
  ['tablespoons', 'tbsp'], ['tablespoon', 'tbsp'], ['teaspoons', 'tsp'], ['teaspoon', 'tsp'],
  ['ounces', 'oz'], ['ounce', 'oz'], ['pounds', 'lb'], ['pound', 'lb'], ['grams', 'g'], ['gram', 'g'],
  ['kilograms', 'kg'], ['kilogram', 'kg'], ['cups', 'cup'], ['cup', 'cup'], ['pieces', 'piece'], ['piece', 'piece'],
  ['pinches', 'pinch'], ['pinch', 'pinch'], ['cloves', 'clove'], ['clove', 'clove'],
];

const FRACTIONS = { '¼': .25, '½': .5, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };

function numberPart(raw) {
  if (raw in FRACTIONS) return FRACTIONS[raw];
  if (/^\d+\/\d+$/.test(raw)) {
    const [a, b] = raw.split('/').map(Number);
    return b ? a / b : null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseAmountAndUnit(raw) {
  const normalized = String(raw || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ').trim();
  const quantityMatch = normalized.match(/^((?:\d+(?:\.\d+)?\s+)?(?:\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])|\d+(?:\.\d+)?)\s+(.*)$/);
  if (!quantityMatch) return { quantity: null, unit: null };

  const rawQuantity = quantityMatch[1].trim();
  const mixed = rawQuantity.match(/^(\d+(?:\.\d+)?)\s+(\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])$/);
  const quantity = mixed ? Number(mixed[1]) + (numberPart(mixed[2]) ?? 0) : numberPart(rawQuantity);
  const remainder = quantityMatch[2];

  for (const [label, unit] of UNITS) {
    const re = new RegExp(`^${label}\\b\\s*`, 'i');
    if (re.test(remainder)) return { quantity, unit };
  }
  return { quantity, unit: null };
}

export function resolveFoodEntity(input) {
  const base = baseResolve(input);
  const { quantity, unit } = parseAmountAndUnit(input);
  return {
    ...base,
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    base_resolver_version: BASE_VERSION,
    quantity: quantity ?? base.quantity ?? null,
    unit: unit ?? base.unit ?? null,
  };
}

export function resolveCanonicalId(canonicalId, input = canonicalId) {
  const entity = getEntityById(canonicalId);
  if (!entity) return { resolver_version: FOOD_ENTITY_RESOLVER_VERSION, raw: input, canonical_id: null, confidence: 0, review_required: true, reason: 'canonical_id_not_found' };
  return {
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    raw: input,
    normalized: entity.name,
    canonical_id: canonicalId,
    canonical_name: entity.name,
    category: entity.category || null,
    matched_alias: entity.name,
    matched_by: 'canonical-id',
    confidence: .999,
    review_required: false,
    quantity: null,
    unit: null,
    parent_id: entity.parent_id || null,
    relations: getEntityRelations(canonicalId),
    flags: entity.flags || {},
  };
}

export function resolverIntegrity() {
  const base = baseIntegrity();
  return { ...base, version: FOOD_ENTITY_RESOLVER_VERSION, base_version: BASE_VERSION };
}
