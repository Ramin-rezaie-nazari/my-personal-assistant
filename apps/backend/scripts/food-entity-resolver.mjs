import taxonomy from '../data/ingredient-taxonomy-v1.json' with { type: 'json' };
import supplement from '../data/ingredient-taxonomy-supplement-v1.json' with { type: 'json' };
import knowledge from '../data/food-entity-knowledge-v1.json' with { type: 'json' };

export const FOOD_ENTITY_RESOLVER_VERSION = 'food-entity-resolver-v1';

const canonicalTaxonomy = [...taxonomy, ...supplement];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripQuantityUnit(value) {
  return value
    .replace(/^\s*(?:about\s+)?(?:\d+(?:\s+\d+\/\d+|[./]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*/i, '')
    .replace(/\b(?:oz|ounce|ounces|lb|lbs|pound|pounds|kg|g|gram|grams|ml|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|dash|clove|cloves|can|cans|package|packages|pkg|stick|sticks|slice|slices|piece|pieces|bunch|bunches|sprig|sprigs)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripPreparation(value) {
  return value
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:freshly|fresh|finely|coarsely|roughly|thinly|thickly|lightly|heaping|packed|divided|melted|softened|chopped|diced|minced|sliced|grated|shredded|peeled|seeded|cored|boneless|skinless|dried|ground|crushed|toasted|roasted|cooked|uncooked|washed|shelled|trimmed|quartered|split|sifted|julienned|shucked|drained|rinsed|optional)\b/gi, ' ')
    .replace(/\b(?:for garnish|for serving|for frying|for dusting|for brushing|for drizzling|to taste|as needed|plus more|plus extra|or more|additional)\b.*$/i, ' ')
    .replace(/[,:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeText(value) {
  return stripPreparation(stripQuantityUnit(normalize(value)))
    .replace(/^'(.*)'$/, '$1')
    .trim();
}

function parseQuantity(value) {
  const normalized = normalize(value);
  const match = normalized.match(/^\s*(\d+(?:\.\d+)?|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])\s*(.*)$/i);
  if (!match) return null;
  const raw = match[1];
  const quantity = raw.includes('/') ? (() => {
    const [a, b] = raw.split('/').map(Number);
    return b ? a / b : null;
  })() : ({ '¼': .25, '½': .5, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 }[raw] ?? Number(raw));
  if (!Number.isFinite(quantity)) return null;
  return { quantity, remainder: match[2].trim() };
}

function parseUnit(value) {
  const normalized = normalize(value);
  const units = [
    ['milliliters', 'ml'], ['milliliter', 'ml'], ['liters', 'l'], ['liter', 'l'],
    ['tablespoons', 'tbsp'], ['tablespoon', 'tbsp'], ['teaspoons', 'tsp'], ['teaspoon', 'tsp'],
    ['ounces', 'oz'], ['ounce', 'oz'], ['pounds', 'lb'], ['pound', 'lb'], ['grams', 'g'], ['gram', 'g'],
    ['kilograms', 'kg'], ['kilogram', 'kg'], ['cups', 'cup'], ['cup', 'cup'], ['pieces', 'piece'], ['piece', 'piece'],
  ];
  for (const [label, unit] of units) {
    const re = new RegExp(`^\\s*(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)\\s+${label}\\b\\s*(.*)$`, 'i');
    const match = normalized.match(re);
    if (match) return { unit, amount: match[1], remainder: match[2].trim() };
  }
  return null;
}

function collectAliasEntries() {
  const entries = [];
  for (const item of canonicalTaxonomy) {
    if (!item?.id || !item?.name) continue;
    const aliases = [item.name, ...(item.aliases || [])];
    for (const alias of aliases) {
      const key = normalize(alias);
      if (!key) continue;
      entries.push({ key, canonicalId: item.id, name: item.name, category: item.category, flags: item.flags || {}, source: 'taxonomy' });
    }
  }
  for (const item of knowledge) {
    if (!item?.id || !item?.name) continue;
    for (const alias of [item.name, ...(item.aliases || [])]) {
      const key = normalize(alias);
      if (!key) continue;
      entries.push({ key, canonicalId: item.id, name: item.name, category: 'variant', flags: {}, source: 'knowledge' });
    }
  }
  return entries.sort((a, b) => b.key.length - a.key.length || a.key.localeCompare(b.key));
}

const aliasEntries = collectAliasEntries();
const exactMap = new Map();
for (const entry of aliasEntries) {
  const existing = exactMap.get(entry.key);
  if (!existing || entry.source === 'knowledge') exactMap.set(entry.key, entry);
}

const knowledgeById = new Map(knowledge.map((item) => [item.id, item]));

function scoreCandidate(cleaned, entry) {
  const exact = cleaned === entry.key;
  if (exact) return 1;
  const tokens = cleaned.split(' ').filter(Boolean);
  const aliasTokens = entry.key.split(' ').filter(Boolean);
  if (aliasTokens.length > tokens.length) return 0;
  const starts = cleaned.startsWith(`${entry.key} `);
  const ends = cleaned.endsWith(` ${entry.key}`);
  const tokenCoverage = aliasTokens.filter((token) => tokens.includes(token)).length / aliasTokens.length;
  return Math.min(.89, (starts || ends ? .78 : .58) + tokenCoverage * .1);
}

function buildResult(input, entry, quantity, unit, matchedBy) {
  const knowledgeItem = knowledgeById.get(entry.canonicalId);
  const confidence = Math.min(0.995, entry.source === 'knowledge' ? .99 : (matchedBy === 'exact' ? .985 : .93));
  return {
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    raw: input,
    normalized: canonicalizeText(input),
    canonical_id: entry.canonicalId,
    canonical_name: entry.name,
    category: entry.category,
    matched_alias: entry.key,
    matched_by: matchedBy,
    confidence,
    review_required: confidence < .9,
    quantity,
    unit,
    parent_id: knowledgeItem?.parent_id ?? null,
    relations: knowledgeItem?.relations || [],
  };
}

export function resolveFoodEntity(input, options = {}) {
  const raw = String(input || '').trim();
  if (!raw) return { resolver_version: FOOD_ENTITY_RESOLVER_VERSION, raw, canonical_id: null, confidence: 0, review_required: true, reason: 'empty_input' };

  const quantityData = parseQuantity(raw);
  const unitData = parseUnit(raw);
  const quantity = quantityData?.quantity ?? (unitData ? Number(unitData.amount) : null);
  const unit = unitData?.unit ?? null;
  const cleaned = canonicalizeText(raw.replace(/^\s*\d+(?:\.\d+)?\s*(?:ml|l|g|kg|oz|lb|cup|cups|tbsp|tsp|tablespoons|teaspoons|ounces|pounds)\b/i, ' '));

  const exact = exactMap.get(cleaned);
  if (exact) return buildResult(raw, exact, quantity, unit, 'exact');

  let best = null;
  for (const entry of aliasEntries) {
    const score = scoreCandidate(cleaned, entry);
    if (score <= 0) continue;
    if (!best || score > best.score || (score === best.score && entry.key.length > best.entry.key.length)) best = { entry, score };
  }

  if (!best || best.score < .78) {
    return {
      resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
      raw,
      normalized: cleaned,
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
      reason: 'unresolved_offline',
    };
  }

  return buildResult(raw, best.entry, quantity, unit, best.score > .9 ? 'fuzzy-high' : 'fuzzy');
}

export function resolveMany(values, options = {}) {
  return (Array.isArray(values) ? values : []).map((value) => resolveFoodEntity(value, options));
}

export function getEntityRelations(canonicalId) {
  return knowledgeById.get(canonicalId)?.relations || [];
}

export function resolverIntegrity() {
  const duplicateAliases = [];
  const seen = new Map();
  for (const entry of aliasEntries) {
    const prior = seen.get(entry.key);
    if (prior && prior.canonicalId !== entry.canonicalId) duplicateAliases.push({ alias: entry.key, ids: [prior.canonicalId, entry.canonicalId] });
    seen.set(entry.key, entry);
  }
  return {
    version: FOOD_ENTITY_RESOLVER_VERSION,
    taxonomy_entries: canonicalTaxonomy.length,
    knowledge_entries: knowledge.length,
    alias_entries: aliasEntries.length,
    conflicting_aliases: duplicateAliases,
    valid: duplicateAliases.length === 0,
  };
}

export { canonicalizeText };
