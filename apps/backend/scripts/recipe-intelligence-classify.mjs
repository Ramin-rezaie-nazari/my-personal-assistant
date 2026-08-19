const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERSION = 'rules-v1';
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_INTELLIGENCE_BATCH || '250'), 25), 1000);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(path, options = {}, attempts = 6) {
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
  return String(value || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function ingredientText(raw) {
  if (!raw) return '';
  if (Array.isArray(raw)) return raw.join(' | ').toLowerCase();
  const s = String(raw);
  // cleaned_ingredients is stored as a Python-style list string. Extract single-quoted items conservatively.
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
  ['salad', /\bsalad\b/], ['soup', /\bsoup|stew\b/], ['cake', /\bcake\b|cheesecake/], ['cookie', /\bcookie|biscuit\b/],
  ['pastry', /\bpastry|tart|pie|croissant|danish\b/], ['dessert', /\bdessert|pudding|mousse|ice cream|gelato|sorbet\b/],
  ['drink', /\bshake|smoothie|juice|tea|coffee|latte|cocktail|drink|punch\b/], ['bread', /\bbread|loaf|focaccia|naan|flatbread\b/],
  ['sauce', /\bsauce|vinaigrette|gravy\b/], ['dip', /\bdip|hummus|salsa\b/], ['breakfast', /\bbreakfast|omelet|omelette|pancake|waffle|french toast\b/],
  ['snack', /\bsnack|energy bar|trail mix\b/], ['side_dish', /\bside dish|coleslaw|slaw\b/],
  ['appetizer', /\bappetizer|appetiser|starter|bruschetta|spring roll|dumpling\b/], ['main_dish', /\bchicken|beef|steak|pasta|rice|curry|taco|pizza|burger|lasagna|casserole|roast|fish|salmon|shrimp|noodle|bowl\b/],
];

const blockers = {
  meat: /\b(beef|steak|veal|pork|ham|bacon|prosciutto|sausage|salami|pepperoni|lamb|mutton|venison|chicken|turkey|duck|goose|rabbit|meat|gelatin|lard|tallow)\b/i,
  fish: /\b(fish|salmon|tuna|cod|trout|anchov|sardine|mackerel|herring|tilapia|sea bass|fish sauce|oyster sauce|shrimp|prawn|crab|lobster|clam|mussel|scallop|octopus|squid)\b/i,
  dairy: /\b(milk|cream|cheese|butter|ghee|yogurt|yoghurt|whey|casein|lactose|buttermilk|sour cream|creme fraiche)\b/i,
  egg: /\b(egg|eggs|mayonnaise|mayo)\b/i,
  honey: /\bhoney\b/i,
  gluten: /\b(wheat|flour|barley|rye|malt|semolina|couscous|farro|bulgur|seitan)\b/i,
  nuts: /\b(almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|peanut|peanuts|tree nut|mixed nuts|nut butter)\b/i,
};

const plantMilkExceptions = /\b(almond milk|soy milk|soya milk|oat milk|coconut milk|rice milk|cashew milk|hazelnut milk)\b/i;
const plantCreamExceptions = /\b(coconut cream|coconut milk|oat cream|soy cream)\b/i;

function dietary(ingredients, recipe) {
  const text = ingredients || '';
  const dairy = blockers.dairy.test(text) && !plantMilkExceptions.test(text) && !plantCreamExceptions.test(text);
  const egg = blockers.egg.test(text) && !/eggplant/.test(text);
  const meat = blockers.meat.test(text);
  const fish = blockers.fish.test(text);
  const honey = blockers.honey.test(text);
  const gluten = blockers.gluten.test(text);
  const nuts = blockers.nuts.test(text);

  const profiles = [];
  const strongAnimalFree = !meat && !fish && !dairy && !egg && !honey;
  profiles.push({ slug: 'vegan', suitable: strongAnimalFree, confidence: strongAnimalFree ? 0.96 : 0.99, reason: strongAnimalFree ? 'No animal-derived blocker detected in available ingredients.' : 'Animal-derived ingredient detected.' });
  profiles.push({ slug: 'vegetarian', suitable: !meat && !fish, confidence: (!meat && !fish) ? 0.96 : 0.99, reason: (!meat && !fish) ? 'No meat or fish blocker detected.' : 'Meat or fish ingredient detected.' });
  profiles.push({ slug: 'pescatarian', suitable: !meat, confidence: !meat ? 0.92 : 0.99, reason: !meat ? 'No meat blocker detected; fish/seafood may be present.' : 'Meat ingredient detected.' });
  profiles.push({ slug: 'dairy_free', suitable: !dairy, confidence: dairy ? 0.99 : 0.92, reason: dairy ? 'Dairy ingredient detected.' : 'No dairy blocker detected.' });
  profiles.push({ slug: 'egg_free', suitable: !egg, confidence: egg ? 0.99 : 0.92, reason: egg ? 'Egg ingredient detected.' : 'No egg blocker detected.' });
  profiles.push({ slug: 'gluten_free', suitable: !gluten, confidence: gluten ? 0.99 : 0.88, reason: gluten ? 'Gluten-containing ingredient detected.' : 'No major gluten ingredient detected.' });
  profiles.push({ slug: 'nut_free', suitable: !nuts, confidence: nuts ? 0.99 : 0.88, reason: nuts ? 'Nut ingredient detected.' : 'No major nut ingredient detected.' });

  const kcal = Number(recipe.kcal_per_serving);
  const protein = Number(recipe.protein_g_per_serving);
  const carbs = Number(recipe.carbs_g_per_serving);
  if (Number.isFinite(kcal)) profiles.push({ slug: 'low_calorie', suitable: kcal <= 500, confidence: 0.98, reason: `kcal/serving=${kcal}` });
  if (Number.isFinite(protein)) profiles.push({ slug: 'high_protein', suitable: protein >= 20, confidence: 0.98, reason: `protein_g/serving=${protein}` });
  if (Number.isFinite(carbs)) profiles.push({ slug: 'low_carb', suitable: carbs <= 25, confidence: 0.96, reason: `carbs_g/serving=${carbs}` });
  if (Number.isFinite(carbs) && carbs <= 10 && Number.isFinite(protein) && protein >= 10) profiles.push({ slug: 'keto', suitable: true, confidence: 0.80, reason: `carbs_g/serving=${carbs}; protein_g/serving=${protein}; preliminary rule only.` });

  const weightFriendly = Number.isFinite(kcal) && kcal <= 550 && Number.isFinite(protein) && protein >= 15;
  profiles.push({ slug: 'weight_loss_friendly', suitable: weightFriendly, confidence: 0.82, reason: weightFriendly ? 'Meets preliminary calorie/protein balance rule.' : 'Does not meet current preliminary calorie/protein balance rule.' });
  return profiles;
}

function classifyCategories(name) {
  const n = cleanText(name);
  const matches = [];
  for (const [slug, re] of categoryRules) if (re.test(n)) matches.push({ slug, confidence: 0.90 });
  if (!matches.some((x) => x.slug === 'main_dish') && !matches.length) matches.push({ slug: 'main_dish', confidence: 0.55 });
  if (n.includes('healthy') || n.includes('light')) matches.push({ slug: 'healthy', confidence: 0.82 });
  if (n.includes('quick') || n.includes('easy')) matches.push({ slug: 'quick_easy', confidence: 0.90 });
  return [...new Map(matches.map((x) => [x.slug, x])).values()];
}

async function main() {
  const recipes = await allRows('recipes','id,name,cuisine,kcal_per_serving,protein_g_per_serving,carbs_g_per_serving,classification_version','created_at.asc');
  const raws = await allRows('recipe_source_raw','recipe_id,raw_payload','created_at.asc');
  const cuisineRows = await allRows('cuisines','id,slug','slug.asc');
  const categoryRows = await allRows('categories','id,slug','slug.asc');
  const dietaryRows = await allRows('dietary_profiles','id,slug','slug.asc');
  const cuisineBySlug = new Map(cuisineRows.map((x) => [x.slug, x.id]));
  const categoryBySlug = new Map(categoryRows.map((x) => [x.slug, x.id]));
  const dietaryBySlug = new Map(dietaryRows.map((x) => [x.slug, x.id]));
  const rawByRecipe = new Map(raws.map((x) => [x.recipe_id, ingredientText(x.raw_payload?.cleaned_ingredients)]));

  let processed = 0; let cuisineCount = 0; let categoryCount = 0; let dietaryCount = 0;
  for (let start = 0; start < recipes.length; start += BATCH) {
    const batch = recipes.slice(start, start + BATCH);
    for (const recipe of batch) {
      const ingredients = rawByRecipe.get(recipe.id) || '';
      const cuisineText = cleanText(recipe.cuisine);
      const matchedCuisine = [...cuisineMap.entries()].find(([label]) => cuisineText === label || cuisineText.startsWith(`${label} `) || cuisineText.includes(`${label} /`));
      if (matchedCuisine && cuisineBySlug.has(matchedCuisine[1])) {
        await rest('recipe_cuisines', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, cuisine_id: cuisineBySlug.get(matchedCuisine[1]), relation_type: cuisineText.includes('fusion') || cuisineText.includes('inspired') ? 'inspired' : 'classified', confidence: 0.88, source: 'recipes.cuisine', evidence: recipe.cuisine }) });
        cuisineCount += 1;
      }

      for (const c of classifyCategories(recipe.name)) {
        const categoryId = categoryBySlug.get(c.slug);
        if (!categoryId) continue;
        await rest('recipe_category_relations', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, category_id: categoryId, confidence: c.confidence, source: 'rules-v1', evidence: recipe.name }) });
        categoryCount += 1;
      }

      for (const d of dietary(ingredients, recipe)) {
        const profileId = dietaryBySlug.get(d.slug);
        if (!profileId) continue;
        await rest('recipe_dietary_profiles', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, dietary_profile_id: profileId, suitability: d.suitable ? 'suitable' : 'not_suitable', confidence: d.confidence, reason: d.reason, source: 'rules-v1', rule_version: VERSION }) });
        dietaryCount += 1;
      }

      await rest(`recipes?id=eq.${encodeURIComponent(recipe.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ classification_version: VERSION }) });
      processed += 1;
    }
    console.log(JSON.stringify({ progress: processed, total: recipes.length, cuisineRelations: cuisineCount, categoryRelations: categoryCount, dietaryRelations: dietaryCount }, null, 2));
  }
  console.log(JSON.stringify({ status: 'complete', processed, cuisineRelations: cuisineCount, categoryRelations: categoryCount, dietaryRelations: dietaryCount, version: VERSION }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
