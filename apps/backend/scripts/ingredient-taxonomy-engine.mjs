import taxonomy from '../data/ingredient-taxonomy-v1.json' with { type: 'json' };

const VERSION = 'ingredient-taxonomy-v1';

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 72) || 'unknown';
}

function parseArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text.replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return text.replace(/^\[/, '').replace(/\]$/, '').split(/\s*[,;]\s*/).map((item) => item.replace(/^['\"]|['\"]$/g, '').trim()).filter(Boolean);
  }
}

const quantityPrefix = /^\s*(?:about\s+)?(?:\d+(?:[\d\s./-]*\d)?|[a-z]+)\b/i;
const unitWords = /\b(?:oz|ounce|ounces|lb|lbs|pound|pounds|kg|g|gram|grams|ml|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|dash|clove|cloves|can|cans|package|packages|pkg|stick|sticks|slice|slices|piece|pieces|bunch|bunches|sprig|sprigs)\b/gi;
const preparationTail = /(?:,|\(|\s+)\b(?:finely|coarsely|roughly|thinly|thickly|freshly|lightly|heaping|packed|divided|melted|softened|chopped|diced|minced|sliced|grated|shredded|peeled|seeded|cored|boneless|skinless|fresh|dried|ground|crushed|toasted|roasted|cooked|uncooked|optional|to taste|as needed|for garnish|for serving|plus more|or more)\b.*$/i;

function cleanIngredientText(value) {
  let text = normalizeText(value)
    .replace(quantityPrefix, '')
    .replace(unitWords, ' ')
    .replace(preparationTail, ' ');
  return text.replace(/\s+/g, ' ').replace(/^[-*•]+\s*/, '').replace(/[,:;]+$/g, '').trim();
}

const aliasIndex = (() => {
  const map = new Map();
  for (const item of taxonomy) {
    if (!item?.id || !item?.name) continue;
    for (const alias of [item.name, ...(item.aliases || [])]) {
      const key = normalizeText(alias);
      if (!key || map.has(key)) continue;
      map.set(key, { alias: key, item });
    }
  }
  return [...map.values()].sort((a, b) => b.alias.length - a.alias.length);
})();

export function taxonomyIntegrity() {
  const ids = new Map();
  const conflictingIds = [];
  const emptyAliases = [];
  for (const item of taxonomy) {
    if (!item?.id || !item?.name) continue;
    const previous = ids.get(item.id);
    if (previous && (previous.name !== item.name || previous.category !== item.category)) conflictingIds.push(item.id);
    ids.set(item.id, item);
    if (!Array.isArray(item.aliases) || !item.aliases.length) emptyAliases.push(item.id);
  }
  return {
    version: VERSION,
    entries: taxonomy.length,
    duplicateIds: [...new Set(taxonomy.map((x) => x.id))].filter((id, index, all) => all.indexOf(id) !== index),
    conflictingIds: [...new Set(conflictingIds)],
    emptyAliases,
    valid: conflictingIds.length === 0 && emptyAliases.length === 0,
  };
}

function matchesAlias(cleaned, alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i').test(cleaned);
}

function deriveDietary(flags) {
  const meat = Boolean(flags.meat);
  const fish = Boolean(flags.fish || flags.crustacean);
  const egg = Boolean(flags.egg);
  const dairy = Boolean(flags.dairy);
  const animalDerived = Boolean(flags.animal_derived || meat || fish || egg || dairy);
  return { vegan_compatible_candidate: !animalDerived, vegetarian_compatible_candidate: !meat && !fish, animal_derived: animalDerived };
}

export function analyzeIngredientLine(rawLine) {
  const raw = String(rawLine || '').trim();
  const cleaned = cleanIngredientText(raw);
  if (!cleaned) return { version: VERSION, raw, canonical_id: null, canonical_name: null, category: null, flags: {}, dietary: null, confidence: 0, review_required: true, reason: 'empty_after_normalization' };
  const match = aliasIndex.find(({ alias }) => matchesAlias(cleaned, alias));
  if (!match) return { version: VERSION, raw, normalized_text: cleaned, canonical_id: `unknown:${slugify(cleaned)}`, canonical_name: cleaned, category: 'unknown', flags: {}, dietary: { vegan_compatible_candidate: null, vegetarian_compatible_candidate: null, animal_derived: null }, confidence: 0.35, review_required: true, reason: 'no_taxonomy_match' };
  const { item, alias } = match;
  const reviewRequired = Boolean(item.flags?.composition_ambiguous);
  return {
    version: VERSION,
    raw,
    normalized_text: cleaned,
    canonical_id: item.id,
    canonical_name: item.name,
    category: item.category,
    matched_alias: alias,
    flags: item.flags || {},
    dietary: deriveDietary(item.flags || {}),
    confidence: reviewRequired ? 0.72 : (alias === normalizeText(item.name) ? 0.98 : 0.94),
    review_required: reviewRequired,
    reason: reviewRequired ? 'composition_ambiguous' : 'taxonomy_alias_match',
  };
}

export function analyzeRecipeIngredients(rawIngredients) {
  const raw = parseArray(rawIngredients);
  const analyzed = raw.map(analyzeIngredientLine).filter((item) => item.canonical_id);
  const canonicalIds = [...new Set(analyzed.map((item) => item.canonical_id))];
  const unresolved = analyzed.filter((item) => item.review_required);
  const flags = {
    contains_animal_meat: analyzed.some((item) => item.flags.meat),
    contains_seafood: analyzed.some((item) => item.flags.fish || item.flags.crustacean),
    contains_dairy: analyzed.some((item) => item.flags.dairy),
    contains_egg: analyzed.some((item) => item.flags.egg),
    contains_tree_nut: analyzed.some((item) => item.flags.tree_nut),
    contains_peanut: analyzed.some((item) => item.flags.peanut),
    contains_sesame: analyzed.some((item) => item.flags.sesame),
    contains_soy: analyzed.some((item) => item.flags.soy),
    contains_gluten_candidate: analyzed.some((item) => item.flags.gluten_candidate),
  };
  const dietary = {
    vegan_candidate: !flags.contains_animal_meat && !flags.contains_seafood && !flags.contains_dairy && !flags.contains_egg,
    vegetarian_candidate: !flags.contains_animal_meat && !flags.contains_seafood,
  };
  const confidence = analyzed.length ? Number((analyzed.reduce((sum, item) => sum + item.confidence, 0) / analyzed.length).toFixed(3)) : 0;
  return { version: VERSION, raw_count: raw.length, analyzed_count: analyzed.length, canonical_count: canonicalIds.length, ingredients: analyzed, canonical_ids: canonicalIds, unresolved_count: unresolved.length, unresolved: unresolved.map(({ raw: original, canonical_id, canonical_name, reason }) => ({ raw: original, canonical_id, canonical_name, reason })), flags, dietary, confidence, coverage: raw.length ? Number((analyzed.length / raw.length).toFixed(3)) : 0, review_required: unresolved.length > 0 };
}

export const TAXONOMY_VERSION = VERSION;
export const TAXONOMY_SIZE = taxonomy.length;
