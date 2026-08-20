import taxonomy from '../data/ingredient-taxonomy-v1.json' with { type: 'json' };
import supplement from '../data/ingredient-taxonomy-supplement-v1.json' with { type: 'json' };
import knowledge from '../data/food-entity-knowledge-v1.json' with { type: 'json' };

export const FOOD_ENTITY_RESOLVER_VERSION = 'food-entity-resolver-v2';
const catalog = [...taxonomy, ...supplement];
const byId = new Map(catalog.filter((x) => x?.id).map((x) => [x.id, x]));
const knowledgeById = new Map(knowledge.filter((x) => x?.id).map((x) => [x.id, x]));

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[-_/]+/g, ' ')
    .replace(/[,:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fractionValue(value) {
  const map = { '¼': .25, '½': .5, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };
  if (value in map) return map[value];
  if (/^\d+\/\d+$/.test(value)) {
    const [a, b] = value.split('/').map(Number);
    return b ? a / b : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseQuantity(text) {
  const normalized = normalize(text);
  const match = normalized.match(/^\s*((?:\d+(?:\.\d+)?\s+)?(?:\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])|\d+(?:\.\d+)?)\s+(.*)$/i);
  if (!match) return { quantity: null, remainder: normalized };
  const raw = match[1].trim();
  const mixed = raw.match(/^(\d+(?:\.\d+)?)\s+(\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])$/);
  const quantity = mixed ? Number(mixed[1]) + fractionValue(mixed[2]) : fractionValue(raw);
  return Number.isFinite(quantity) ? { quantity, remainder: match[2].trim() } : { quantity: null, remainder: normalized };
}

const UNIT_REPLACEMENTS = [
  ['milliliters', 'ml'], ['milliliter', 'ml'], ['liters', 'l'], ['liter', 'l'],
  ['tablespoons', 'tbsp'], ['tablespoon', 'tbsp'], ['teaspoons', 'tsp'], ['teaspoon', 'tsp'],
  ['ounces', 'oz'], ['ounce', 'oz'], ['pounds', 'lb'], ['pound', 'lb'], ['grams', 'g'], ['gram', 'g'],
  ['kilograms', 'kg'], ['kilogram', 'kg'], ['cups', 'cup'], ['cup', 'cup'], ['pieces', 'piece'], ['piece', 'piece'],
  ['pinches', 'pinch'], ['pinch', 'pinch'], ['cloves', 'clove'], ['clove', 'clove'],
];

function extractUnit(text) {
  for (const [label, unit] of UNIT_REPLACEMENTS) {
    const re = new RegExp(`^\\s*${label}\\b\\s*(.*)$`, 'i');
    const match = text.match(re);
    if (match) return { unit, remainder: match[1].trim() };
  }
  return { unit: null, remainder: text };
}

function cleanIngredient(value) {
  let text = normalize(value)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*(?:about\s+)?/, '');
  const parsed = parseQuantity(text);
  text = parsed.remainder;
  text = extractUnit(text).remainder;
  text = text
    .replace(/^\s*(?:of|a|an)\s+/i, '')
    .replace(/^(?:juice|zest)\s+of\s+(?:\d+(?:\/\d+)?\s+)?/i, '')
    .replace(/\b(?:freshly|fresh|finely|coarsely|roughly|thinly|thickly|lightly|heaping|packed|divided|melted|softened|chopped|diced|minced|sliced|grated|shredded|peeled|seeded|cored|boneless|skinless|dried|ground|crushed|toasted|roasted|cooked|uncooked|washed|shelled|trimmed|quartered|split|sifted|julienned|shucked|drained|rinsed|optional)\b/gi, ' ')
    .replace(/\b(?:for garnish|for serving|for frying|for dusting|for brushing|for drizzling|to taste|as needed|plus more|plus extra|or more|additional)\b.*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { normalized: text, quantity: parsed.quantity };
}

const aliasEntries = [];
for (const item of catalog) {
  if (!item?.id || !item?.name) continue;
  for (const alias of [item.name, ...(item.aliases || [])]) {
    const key = normalize(alias);
    if (key) aliasEntries.push({ key, id: item.id, item });
  }
}
for (const item of knowledge) {
  if (!item?.id || !item?.name) continue;
  for (const alias of [item.name, ...(item.aliases || [])]) {
    const key = normalize(alias);
    if (key) aliasEntries.push({ key, id: item.id, item });
  }
}

aliasEntries.sort((a, b) => b.key.length - a.key.length || a.key.localeCompare(b.key));
const exact = new Map();
for (const entry of aliasEntries) {
  if (!exact.has(entry.key) || knowledgeById.has(entry.id)) exact.set(entry.key, entry);
}

function entryResult(raw, entry, quantity, unit, matchedBy) {
  const base = byId.get(entry.id);
  const relation = knowledgeById.get(entry.id);
  return {
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    raw,
    normalized: normalize(raw),
    canonical_id: entry.id,
    canonical_name: base?.name || relation?.name || entry.item?.name || null,
    category: base?.category || null,
    matched_alias: entry.key,
    matched_by: matchedBy,
    confidence: matchedBy === 'exact' || matchedBy === 'localized-alias' ? .99 : .93,
    review_required: false,
    quantity,
    unit,
    parent_id: relation?.parent_id ?? null,
    relations: relation?.relations || [],
    flags: base?.flags || {},
  };
}

export function resolveFoodEntity(input) {
  const raw = String(input || '').trim();
  if (!raw) return { resolver_version: FOOD_ENTITY_RESOLVER_VERSION, raw, canonical_id: null, confidence: 0, review_required: true, reason: 'empty_input' };
  const cleaned = cleanIngredient(raw);
  const quantity = cleaned.quantity;
  const unit = extractUnit(cleaned.normalized).unit;
  const text = extractUnit(cleaned.normalized).remainder;

  const exactEntry = exact.get(text);
  if (exactEntry) return entryResult(raw, exactEntry, quantity, unit, 'exact');

  let best = null;
  for (const entry of aliasEntries) {
    if (entry.key.length < 3) continue;
    if (text === entry.key || text.startsWith(`${entry.key} `) || text.endsWith(` ${entry.key}`)) {
      const score = Math.min(.94, .78 + (entry.key.split(' ').length * .04));
      if (!best || score > best.score || (score === best.score && entry.key.length > best.entry.key.length)) best = { entry, score };
    }
  }
  if (best) return entryResult(raw, best.entry, quantity, unit, 'bounded-fuzzy');

  return {
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    raw,
    normalized: text,
    canonical_id: null,
    canonical_name: null,
    category: null,
    matched_alias: null,
    matched_by: null,
    confidence: 0,
    review_required: true,
    quantity,
    unit,
    relations: [],
    flags: {},
    reason: 'unresolved_offline',
  };
}

export function getEntityById(canonicalId) {
  return byId.get(canonicalId) || knowledgeById.get(canonicalId) || null;
}

export function getEntityRelations(canonicalId) {
  return knowledgeById.get(canonicalId)?.relations || [];
}

export function resolverIntegrity() {
  const conflicts = [];
  const seen = new Map();
  for (const entry of aliasEntries) {
    const prior = seen.get(entry.key);
    if (prior && prior.id !== entry.id) conflicts.push({ alias: entry.key, ids: [prior.id, entry.id] });
    seen.set(entry.key, entry);
  }
  return {
    version: FOOD_ENTITY_RESOLVER_VERSION,
    taxonomy_entries: catalog.length,
    knowledge_entries: knowledge.length,
    alias_entries: aliasEntries.length,
    conflicting_aliases: conflicts,
    valid: conflicts.length === 0,
  };
}
