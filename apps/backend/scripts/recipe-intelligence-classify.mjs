const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERSION = 'rules-v2';
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_INTELLIGENCE_BATCH || '250'), 25), 500);
const LIMIT = Math.max(Number(process.env.RECIPE_INTELLIGENCE_LIMIT || '0'), 0);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(path, options = {}, attempts = 7) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (r.status === 429 || r.status >= 500) { await sleep(750 * 2 ** i); continue; }
      throw new Error(`${r.status} ${path}: ${text}`);
    } catch (e) {
      last = e;
      if (i < attempts - 1) await sleep(750 * 2 ** i);
    }
  }
  throw last;
}

async function allRows(table, select, order = 'id.asc') {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) return rows;
  }
}

function cleanText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ingredientText(raw) {
  if (!raw) return '';
  if (Array.isArray(raw)) return raw.join(' | ').toLowerCase();
  const s = String(raw);
  const matches = s.match(/'(?:\\'|[^'])*'/g);
  if (matches?.length) return matches.map((x) => x.slice(1, -1).replace(/\\'/g, "'")).join(' | ').toLowerCase();
  return s.toLowerCase();
}

const cuisineMap = new Map([
  ['american', 'american'], ['italian', 'italian'], ['mexican', 'mexican'], ['french', 'french'], ['indian', 'indian'],
  ['chinese', 'chinese'], ['japanese', 'japanese'], ['korean', 'korean'], ['thai', 'thai'], ['vietnamese', 'vietnamese'],
  ['mediterranean', 'mediterranean'], ['middle eastern', 'middle_eastern'], ['turkish', 'turkish'], ['greek', 'greek'],
  ['spanish', 'spanish'], ['british', 'british'], ['persian', 'persian'], ['south asian', 'south_asian'],
  ['latin american', 'latin_american'], ['african', 'african'], ['caribbean', 'caribbean'], ['fusion', 'fusion'],
  ['international', 'international'],
]);

const categoryRules = [
  ['salad', /\bsalad\b|coleslaw|slaw\b/],
  ['soup', /\bsoup\b|\bstew\b|chowder/],
  ['cake', /\bcake\b|cheesecake/],
  ['cookie', /\bcookie\b|\bbiscuit\b/],
  ['pastry', /\bpastry\b|\btart\b|\bpie\b|croissant|danish/],
  ['dessert', /\bdessert\b|pudding|mousse|ice cream|gelato|sorbet/],
  ['drink', /\bshake\b|smoothie|juice|tea|coffee|latte|cocktail|drink|punch/],
  ['bread', /\bbread\b|\bloaf\b|focaccia|naan|flatbread/],
  ['sauce', /\bsauce\b|vinaigrette|gravy/],
  ['dip', /\bdip\b|hummus|salsa/],
  ['breakfast', /\bbreakfast\b|omelet|omelette|pancake|waffle|french toast/],
  ['snack', /\bsnack\b|energy bar|trail mix/],
  ['side_dish', /side dish|coleslaw|slaw/],
  ['appetizer', /appetizer|appetiser|starter|bruschetta|spring roll|dumpling/],
  ['main_dish', /\bchicken\b|\bbeef\b|\bsteak\b|\bpasta\b|\brice\b|\bcurry\b|\btaco\b|\bpizza\b|\bburger\b|\blasagna\b|\bcasserole\b|\broast\b|\bfish\b|\bsalmon\b|\bshrimp\b|\bnoodle\b|\bbowl\b/],
];

const blockers = {
  meat: /\b(beef|steak|veal|pork|ham|bacon|prosciutto|sausage|salami|pepperoni|lamb|mutton|venison|chicken|turkey|duck|goose|rabbit|meat|gelatin|lard|tallow|chorizo)\b/i,
  fish: /\b(fish|salmon|tuna|cod|trout|anchov|sardine|mackerel|herring|tilapia|sea bass|fish sauce|oyster sauce|shrimp|prawn|crab|lobster|clam|mussel|scallop|octopus|squid)\b/i,
  dairy: /\b(milk|cream|cheese|butter|ghee|yogurt|yoghurt|whey|casein|lactose|buttermilk|sour cream|creme fraiche)\b/i,
  egg: /\b(egg|eggs|mayonnaise|mayo)\b/i,
  honey: /\bhoney\b/i,
  gluten: /\b(wheat|flour|barley|rye|malt|semolina|couscous|farro|bulgur|seitan)\b/i,
  nuts: /\b(almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|peanut|peanuts|tree nut|mixed nuts|nut butter)\b/i,
};

const ambiguous = {
  animal: /\b(broth|stock|bouillon|seasoning|sauce|dressing|marshmallow|chocolate|wine|bread|roll|pasta)\b/i,
  dairy: /\b(chocolate|caramel|butter flavor|natural flavor|protein powder)\b/i,
  gluten: /\b(oats|oat|soy sauce|tamari|spices|seasoning|baking powder)\b/i,
  nuts: /\b(pesto|praline|nougat|marzipan|granola|cookie)\b/i,
};

const plantMilkExceptions = /\b(almond milk|soy milk|soya milk|oat milk|coconut milk|rice milk|cashew milk|hazelnut milk)\b/i;
const plantCreamExceptions = /\b(coconut cream|coconut milk|oat cream|soy cream)\b/i;

function evidenceState(text, blocker, ambiguousRule) {
  if (!text) return { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' };
  if (blocker.test(text)) return { suitability: 'not_suitable', confidence: 0.99, reason: 'Explicit incompatible ingredient detected.' };
  if (ambiguousRule?.test(text)) return { suitability: 'uncertain', confidence: 0.62, reason: 'Ingredient wording is ambiguous and requires deeper ingredient normalization.' };
  return { suitability: 'suitable', confidence: 0.95, reason: 'No incompatible ingredient detected in available ingredient text.' };
}

function dietary(ingredients, recipe) {
  const text = ingredients || '';
  const hasIngredients = text.trim().length > 0;
  const results = [];

  const dairyPattern = new RegExp(blockers.dairy.source, 'i');
  const dairyHit = dairyPattern.test(text) && !plantMilkExceptions.test(text) && !plantCreamExceptions.test(text);
  const eggHit = blockers.egg.test(text) && !/eggplant/.test(text);
  const meatHit = blockers.meat.test(text);
  const fishHit = blockers.fish.test(text);
  const honeyHit = blockers.honey.test(text);
  const glutenHit = blockers.gluten.test(text);
  const nutsHit = blockers.nuts.test(text);

  const vegan = !hasIngredients
    ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' }
    : meatHit || fishHit || dairyHit || eggHit || honeyHit
      ? { suitability: 'not_suitable', confidence: 0.99, reason: 'At least one animal-derived ingredient was detected.' }
      : ambiguous.animal.test(text)
        ? { suitability: 'uncertain', confidence: 0.62, reason: 'Potentially animal-derived ingredient category requires normalization.' }
        : { suitability: 'suitable', confidence: 0.95, reason: 'No animal-derived blocker detected in available ingredients.' };
  results.push({ slug: 'vegan', ...vegan });

  const vegetarian = !hasIngredients
    ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' }
    : meatHit || fishHit
      ? { suitability: 'not_suitable', confidence: 0.99, reason: 'Meat or fish ingredient detected.' }
      : { suitability: 'suitable', confidence: 0.95, reason: 'No meat or fish ingredient detected.' };
  results.push({ slug: 'vegetarian', ...vegetarian });

  const pescatarian = !hasIngredients
    ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' }
    : meatHit
      ? { suitability: 'not_suitable', confidence: 0.99, reason: 'Meat ingredient detected.' }
      : ambiguous.animal.test(text)
        ? { suitability: 'uncertain', confidence: 0.65, reason: 'Potentially animal-derived ingredient category requires normalization.' }
        : { suitability: 'suitable', confidence: 0.93, reason: 'No meat ingredient detected.' };
  results.push({ slug: 'pescatarian', ...pescatarian });

  const dairy = evidenceState(text, new RegExp(`${blockers.dairy.source}${plantMilkExceptions.test(text) || plantCreamExceptions.test(text) ? '(?!x)x' : ''}`, 'i'), ambiguous.dairy);
  results.push({ slug: 'dairy_free', ...dairyHit ? { suitability: 'not_suitable', confidence: 0.99, reason: 'Dairy ingredient detected.' } : !hasIngredients ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' } : ambiguous.dairy.test(text) ? { suitability: 'uncertain', confidence: 0.62, reason: 'Potential dairy-containing derivative may require normalization.' } : { suitability: 'suitable', confidence: 0.94, reason: 'No direct dairy ingredient detected.' });

  results.push({ slug: 'egg_free', ...(eggHit ? { suitability: 'not_suitable', confidence: 0.99, reason: 'Egg ingredient detected.' } : !hasIngredients ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' } : { suitability: 'suitable', confidence: 0.94, reason: 'No direct egg ingredient detected.' }) });
  results.push({ slug: 'gluten_free', ...(glutenHit ? { suitability: 'not_suitable', confidence: 0.99, reason: 'Gluten-containing ingredient detected.' } : !hasIngredients ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' } : ambiguous.gluten.test(text) ? { suitability: 'uncertain', confidence: 0.65, reason: 'Ingredient wording may hide a gluten source.' } : { suitability: 'suitable', confidence: 0.88, reason: 'No major gluten ingredient detected; cross-contact/certification not assessed.' }) });
  results.push({ slug: 'nut_free', ...(nutsHit ? { suitability: 'not_suitable', confidence: 0.99, reason: 'Nut ingredient detected.' } : !hasIngredients ? { suitability: 'uncertain', confidence: 0, reason: 'No ingredient evidence available.' } : ambiguous.nuts.test(text) ? { suitability: 'uncertain', confidence: 0.68, reason: 'Possible hidden nut source needs normalization.' } : { suitability: 'suitable', confidence: 0.88, reason: 'No major nut ingredient detected; cross-contact not assessed.' }) });

  const kcal = Number(recipe.kcal_per_serving);
  const protein = Number(recipe.protein_g_per_serving);
  const carbs = Number(recipe.carbs_g_per_serving);

  if (Number.isFinite(kcal)) results.push({ slug: 'low_calorie', suitability: kcal <= 500 ? 'suitable' : 'not_suitable', confidence: 0.99, reason: `kcal/serving=${kcal}` });
  if (Number.isFinite(protein)) results.push({ slug: 'high_protein', suitability: protein >= 20 ? 'suitable' : 'not_suitable', confidence: 0.99, reason: `protein_g/serving=${protein}` });
  if (Number.isFinite(carbs)) results.push({ slug: 'low_carb', suitability: carbs <= 25 ? 'suitable' : 'not_suitable', confidence: 0.99, reason: `carbs_g/serving=${carbs}` });

  if (Number.isFinite(carbs) && carbs <= 10 && Number.isFinite(protein) && protein >= 10 && Number.isFinite(kcal) && kcal > 0) {
    results.push({ slug: 'keto', suitability: carbs <= 10 ? 'suitable' : 'not_suitable', confidence: 0.78, reason: `Preliminary macro rule: carbs_g/serving=${carbs}, protein_g/serving=${protein}. Not a clinical keto determination.` });
  } else if (Number.isFinite(carbs) && Number.isFinite(kcal)) {
    results.push({ slug: 'keto', suitability: 'not_suitable', confidence: 0.72, reason: 'Does not meet the preliminary macro screen; not a clinical determination.' });
  }

  if (Number.isFinite(kcal) && Number.isFinite(protein)) {
    const score = (kcal <= 550 ? 0.5 : 0) + (protein >= 15 ? 0.5 : 0);
    results.push({ slug: 'weight_loss_friendly', suitability: score >= 1 ? 'suitable' : 'not_suitable', confidence: 0.78, reason: `Preliminary balance rule: kcal/serving=${kcal}, protein_g/serving=${protein}.` });
  }

  return results;
}

function classifyCategories(recipe) {
  const title = cleanText(recipe.name);
  const ingredients = cleanText(recipe.ingredients || '');
  const text = `${title} ${ingredients}`;
  const matches = [];

  for (const [slug, re] of categoryRules) {
    if (re.test(text)) matches.push({ slug, confidence: title && re.test(title) ? 0.96 : 0.84, evidence: title && re.test(title) ? `title:${recipe.name}` : 'ingredient/name text' });
  }

  if (Number.isFinite(recipe.total_minutes)) {
    if (recipe.total_minutes <= 30) matches.push({ slug: 'quick_easy', confidence: 0.84, evidence: `total_minutes=${recipe.total_minutes}` });
  } else if (/\bquick\b|\beasy\b/.test(title)) {
    matches.push({ slug: 'quick_easy', confidence: 0.92, evidence: `title:${recipe.name}` });
  }

  if (Number.isFinite(recipe.protein_g_per_serving) && recipe.protein_g_per_serving >= 20) matches.push({ slug: 'healthy', confidence: 0.78, evidence: `protein_g/serving=${recipe.protein_g_per_serving}` });
  if (Number.isFinite(recipe.kcal_per_serving) && recipe.kcal_per_serving <= 500) matches.push({ slug: 'healthy', confidence: 0.78, evidence: `kcal/serving=${recipe.kcal_per_serving}` });

  return [...new Map(matches.map((x) => [x.slug, x])).values()];
}

function splitCuisineLabels(value) {
  const text = cleanText(value);
  if (!text) return [];
  const labels = [];
  for (const [label, slug] of cuisineMap.entries()) if (text.includes(label)) labels.push({ label, slug, relationType: text.includes('inspired') && text.includes(label) ? 'inspired' : text.includes('fusion') ? 'fusion' : 'classified' });
  return [...new Map(labels.map((x) => [x.slug, x])).values()];
}

async function main() {
  let recipes = await allRows('recipes', 'id,name,cuisine,total_minutes,kcal_per_serving,protein_g_per_serving,carbs_g_per_serving,classification_version', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_payload', 'created_at.asc');
  const cuisineRows = await allRows('cuisines', 'id,slug', 'slug.asc');
  const categoryRows = await allRows('categories', 'id,slug', 'slug.asc');
  const dietaryRows = await allRows('dietary_profiles', 'id,slug', 'slug.asc');

  const cuisineBySlug = new Map(cuisineRows.map((x) => [x.slug, x.id]));
  const categoryBySlug = new Map(categoryRows.map((x) => [x.slug, x.id]));
  const dietaryBySlug = new Map(dietaryRows.map((x) => [x.slug, x.id]));
  const rawByRecipe = new Map(raws.map((x) => [x.recipe_id, ingredientText(x.raw_payload?.cleaned_ingredients)]));

  let processed = 0, cuisineCount = 0, categoryCount = 0, dietaryCount = 0;
  for (let start = 0; start < recipes.length; start += BATCH) {
    const batch = recipes.slice(start, start + BATCH);
    for (const recipe of batch) {
      const ingredients = rawByRecipe.get(recipe.id) || '';
      const cuisineLabels = splitCuisineLabels(recipe.cuisine);
      for (const c of cuisineLabels) {
        const cuisineId = cuisineBySlug.get(c.slug);
        if (!cuisineId) continue;
        await rest('recipe_cuisines', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, cuisine_id: cuisineId, relation_type: c.relationType, confidence: 0.9, source: 'recipes.cuisine', evidence: recipe.cuisine }) });
        cuisineCount += 1;
      }

      const recipeForCategory = { ...recipe, ingredients };
      for (const c of classifyCategories(recipeForCategory)) {
        const categoryId = categoryBySlug.get(c.slug);
        if (!categoryId) continue;
        await rest('recipe_category_relations', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, category_id: categoryId, confidence: c.confidence, source: VERSION, evidence: c.evidence }) });
        categoryCount += 1;
      }

      for (const d of dietary(ingredients, recipe)) {
        const profileId = dietaryBySlug.get(d.slug);
        if (!profileId) continue;
        await rest('recipe_dietary_profiles', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, dietary_profile_id: profileId, suitability: d.suitability, confidence: d.confidence, reason: d.reason, source: VERSION, rule_version: VERSION }) });
        dietaryCount += 1;
      }

      await rest(`recipes?id=eq.${encodeURIComponent(recipe.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ classification_version: VERSION }) });
      processed += 1;
    }
    console.log(JSON.stringify({ progress: processed, total: recipes.length, cuisineRelations: cuisineCount, categoryRelations: categoryCount, dietaryRelations: dietaryCount, version: VERSION }, null, 2));
  }

  console.log(JSON.stringify({ status: 'complete', processed, cuisineRelations: cuisineCount, categoryRelations: categoryCount, dietaryRelations: dietaryCount, version: VERSION }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
