import baseTaxonomy from '../data/ingredient-taxonomy-v1.json' with { type: 'json' };
import supplementTaxonomy from '../data/ingredient-taxonomy-supplement-v1.json' with { type: 'json' };

const taxonomy = [...baseTaxonomy, ...supplementTaxonomy];
const VERSION = 'ingredient-taxonomy-v1';

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-_]+/g, ' ')
    .replace(/['\"]+/g, ' ')
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
    const parsed = JSON.parse(text.replace(/'/g, '\"'));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return text.replace(/^\[/, '').replace(/\]$/, '').split(/\s*;\s*/).map((item) => item.replace(/^['\"]|['\"]$/g, '').trim()).filter(Boolean);
  }
}

const quantityPrefix = /^\s*[\"']*(?:about\s+)?(?:\d+(?:\s+\d+\/\d+|[./]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*/i;
const unitWords = /\b(?:oz|ounce|ounces|lb|lbs|pound|pounds|kg|g|gram|grams|ml|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|dash|clove|cloves|can|cans|package|packages|pkg|stick|sticks|slice|slices|piece|pieces|bunch|bunches|sprig|sprigs)\b/gi;
const culinaryModifiers = /\b(?:freshly|fresh|finely|coarsely|roughly|thinly|thickly|lightly|heaping|packed|divided|melted|softened|chopped|diced|minced|sliced|grated|shredded|peeled|seeded|cored|boneless|skinless|dried|ground|crushed|toasted|roasted|cooked|uncooked|shelled|shucked|washed|sifted|optional|split|lengthwise|julienned|quartered|rinsed|drained|picked over|ends trimmed|cut into(?:\s+\d+[a-z0-9/.-]*)?(?:\s+pieces?)?|cut in half|torn into\s+[^,;]+|skin on|casings removed)\b/gi;
const trailingNote = /\b(?:for garnish|for serving|for frying|for dusting|for brushing|for drizzling|for surface|for grill|to taste|as needed|plus (?:more|extra|additional)|or more)\b.*$/i;

const nonIngredientPatterns = [
  /\b(?:instant|deep[- ]fat|candy|meat)\s+thermometer\b/i,
  /\bthermometer\b/i,
  /\bkitchen\s+string\b/i,
  /\bparchment\s+paper\b/i,
  /\baluminum\s+foil\b/i,
  /\bfoil\b/i,
  /\btoothpick(?:s)?\b/i,
  /\bskewer(?:s)?\b/i,
  /\bkitchen\s+towel\b/i,
  /\bpaper\s+towel\b/i,
  /\bplastic\s+wrap\b/i,
  /\bwire\s+rack\b/i,
  /\bbaking\s+sheet\b/i,
  /\bcast[- ]iron\s+skillet\b/i,
  /\bspice\s+mill\b/i,
];

function cleanIngredientText(value) {
  let text = normalizeText(value)
    .replace(/\([^)]*\)/g, ' ')
    .replace(quantityPrefix, '')
    .replace(/^(?:a\s+)?(?:pinch|dash)\s+of\s+/i, '')
    .replace(/^(?:juice|zest)\s+of\s+(?:\d+(?:\/\d+)?\s+)?/i, '')
    .replace(unitWords, ' ')
    .replace(trailingNote, ' ')
    .replace(culinaryModifiers, ' ')
    .replace(/[,:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
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
  return [...map.values()].sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));
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
  const duplicateIds = [...new Set(taxonomy.map((x) => x.id))].filter((id, index, all) => all.indexOf(id) !== index);
  return {
    version: VERSION,
    entries: taxonomy.length,
    duplicateIds,
    conflictingIds: [...new Set(conflictingIds)],
    emptyAliases,
    valid: duplicateIds.length === 0 && conflictingIds.length === 0 && emptyAliases.length === 0,
  };
}

function aliasSpecificity(alias) {
  return alias.split(' ').length;
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

function classifyNonIngredient(raw, cleaned) {
  const text = `${normalizeText(raw)} ${cleaned}`.trim();
  if (!text) return false;
  return nonIngredientPatterns.some((pattern) => pattern.test(text));
}

export function analyzeIngredientLine(rawLine) {
  const raw = String(rawLine || '').trim();
  const cleaned = cleanIngredientText(raw);
  if (classifyNonIngredient(raw, cleaned)) return {
    version: VERSION,
    raw,
    normalized_text: cleaned,
    canonical_id: null,
    canonical_name: null,
    category: 'non_ingredient',
    flags: {},
    dietary: null,
    confidence: 0.99,
    review_required: false,
    non_ingredient: true,
    reason: 'non_food_or_equipment',
  };
  if (!cleaned || /^(?:optional|picked over|split|washed|sifted|lightly toasted|for frying|plus more|plus extra|plus additional|finely diced|lightly crushed|julienned|lengthwise|cut in half|drained|quartered|rinsed|skin on)$/i.test(cleaned)) return { version: VERSION, raw, canonical_id: null, canonical_name: null, category: 'preparation_note', flags: {}, dietary: null, confidence: 0.99, review_required: false, non_ingredient: true, reason: 'preparation_note' };

  const exact = aliasIndex.find(({ alias }) => alias === cleaned);
  const match = exact || aliasIndex
    .filter(({ alias }) => matchesAlias(cleaned, alias))
    .sort((a, b) => aliasSpecificity(b.alias) - aliasSpecificity(a.alias) || b.alias.length - a.alias.length)[0];

  if (!match) return {
    version: VERSION,
    raw,
    normalized_text: cleaned,
    canonical_id: `unknown:${slugify(cleaned)}`,
    canonical_name: cleaned,
    category: 'unknown',
    flags: {},
    dietary: { vegan_compatible_candidate: null, vegetarian_compatible_candidate: null, animal_derived: null },
    confidence: 0.35,
    review_required: true,
    non_ingredient: false,
    reason: 'no_taxonomy_match',
  };

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
    non_ingredient: false,
    reason: reviewRequired ? 'composition_ambiguous' : 'taxonomy_alias_match',
  };
}

export function analyzeRecipeIngredients(rawIngredients) {
  const raw = parseArray(rawIngredients);
  const sourceParts = raw.filter(Boolean);
  const analyzed = sourceParts.map(analyzeIngredientLine);
  const ingredientResults = analyzed.filter((item) => !item.non_ingredient);
  const canonicalIds = [...new Set(ingredientResults.filter((item) => item.canonical_id && item.category !== 'unknown').map((item) => item.canonical_id))];
  const unresolved = ingredientResults.filter((item) => item.review_required || item.category === 'unknown');
  const nonIngredientCount = analyzed.filter((item) => item.non_ingredient).length;
  const resolvedIngredientCount = ingredientResults.filter((item) => item.canonical_id && item.category !== 'unknown' && !item.review_required).length;
  const flags = {
    contains_animal_meat: ingredientResults.some((item) => item.flags.meat),
    contains_seafood: ingredientResults.some((item) => item.flags.fish || item.flags.crustacean),
    contains_dairy: ingredientResults.some((item) => item.flags.dairy),
    contains_egg: ingredientResults.some((item) => item.flags.egg),
    contains_tree_nut: ingredientResults.some((item) => item.flags.tree_nut),
    contains_peanut: ingredientResults.some((item) => item.flags.peanut),
    contains_sesame: ingredientResults.some((item) => item.flags.sesame),
    contains_soy: ingredientResults.some((item) => item.flags.soy),
    contains_gluten_candidate: ingredientResults.some((item) => item.flags.gluten_candidate),
  };
  const dietary = {
    vegan_candidate: !flags.contains_animal_meat && !flags.contains_seafood && !flags.contains_dairy && !flags.contains_egg && !unresolved.length,
    vegetarian_candidate: !flags.contains_animal_meat && !flags.contains_seafood && !unresolved.length,
  };
  const confidence = ingredientResults.length ? Number((ingredientResults.reduce((sum, item) => sum + item.confidence, 0) / ingredientResults.length).toFixed(3)) : 0;
  return {
    version: VERSION,
    raw_count: raw.length,
    source_part_count: sourceParts.length,
    analyzed_count: ingredientResults.length,
    analyzed_count_total: analyzed.length,
    canonical_count: canonicalIds.length,
    ingredients: analyzed,
    canonical_ids: canonicalIds,
    unresolved_count: unresolved.length,
    non_ingredient_count: nonIngredientCount,
    resolved_ingredient_count: resolvedIngredientCount,
    unresolved: unresolved.map(({ raw: original, canonical_id, canonical_name, reason }) => ({ raw: original, canonical_id, canonical_name, reason })),
    flags,
    dietary,
    confidence,
    coverage: ingredientResults.length ? Number((resolvedIngredientCount / ingredientResults.length).toFixed(3)) : 1,
    classification_coverage: sourceParts.length ? Number(((resolvedIngredientCount + nonIngredientCount) / sourceParts.length).toFixed(3)) : 1,
    review_required: unresolved.length > 0,
  };
}

export const TAXONOMY_VERSION = VERSION;
export const TAXONOMY_SIZE = taxonomy.length;
