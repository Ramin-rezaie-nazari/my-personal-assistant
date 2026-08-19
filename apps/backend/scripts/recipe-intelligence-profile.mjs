const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERSION = 'profile-v1';
const LIMIT = Math.max(Number(process.env.RECIPE_PROFILE_LIMIT || '0'), 0);
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_PROFILE_BATCH || '250'), 25), 1000);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function bucket(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  if (minutes <= 15) return '0_15';
  if (minutes <= 30) return '16_30';
  if (minutes <= 45) return '31_45';
  if (minutes <= 60) return '46_60';
  if (minutes <= 90) return '61_90';
  return '90_plus';
}

function normText(v) {
  return String(v || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
}

function rawText(rawPayload, rawInstructions) {
  const bits = [];
  if (rawInstructions) bits.push(String(rawInstructions));
  for (const key of ['instructions', 'raw_instructions', 'directions', 'method']) {
    if (rawPayload?.[key]) bits.push(String(rawPayload[key]));
  }
  if (Array.isArray(rawPayload?.cleaned_ingredients)) bits.push(rawPayload.cleaned_ingredients.join(' '));
  else if (rawPayload?.cleaned_ingredients) bits.push(String(rawPayload.cleaned_ingredients));
  return normText(bits.join(' '));
}

function detectEquipment(text) {
  const rules = [
    ['oven', /\b(oven|bake|roast|broil|broiler)\b/],
    ['stovetop', /\b(stovetop|saucepan|skillet|frying pan|saute|sauté|boil|simmer)\b/],
    ['grill', /\b(grill|barbecue|bbq)\b/],
    ['blender', /\b(blender|blend|puree|purée)\b/],
    ['food_processor', /\b(food processor|processor)\b/],
    ['microwave', /\b(microwave)\b/],
    ['slow_cooker', /\b(slow cooker|crockpot)\b/],
    ['pressure_cooker', /\b(pressure cooker|instant pot)\b/],
    ['air_fryer', /\b(air fryer)\b/],
  ];
  return rules.filter(([, re]) => re.test(text)).map(([name]) => name);
}

function detectTechniques(text) {
  const rules = [
    ['bake', /\bbake|baking\b/], ['roast', /\broast|roasting\b/], ['boil', /\bboil|boiling\b/],
    ['simmer', /\bsimmer|simmering\b/], ['saute', /\bsaute|sauté\b/], ['grill', /\bgrill|grilling\b/],
    ['fry', /\bfry|frying|deep-fry|pan-fry\b/], ['steam', /\bsteam|steaming\b/],
    ['blend', /\bblend|blending|puree|purée\b/], ['marinate', /\bmarinat/],
  ];
  return rules.filter(([, re]) => re.test(text)).map(([name]) => name);
}

function mealSlots(name, totalMinutes) {
  const n = normText(name);
  const slots = new Set();
  if (/\bbreakfast|omelet|omelette|pancake|waffle|french toast|granola\b/.test(n)) slots.add('breakfast');
  if (/\blunch\b/.test(n)) slots.add('lunch');
  if (/\bdinner\b/.test(n)) slots.add('dinner');
  if (/\bsalad|sandwich|wrap|soup\b/.test(n)) slots.add('lunch');
  if (/\bmain|chicken|beef|steak|pasta|rice|curry|taco|pizza|burger|lasagna|casserole|salmon|shrimp|noodle|bowl\b/.test(n)) slots.add('dinner');
  if (/\bsnack|cookie|bar|smoothie|shake\b/.test(n)) slots.add('snack');
  if (/\bdessert|cake|pie|pastry|cookie|ice cream|gelato|pudding|mousse\b/.test(n)) slots.add('snack');
  if (!slots.size && Number.isFinite(totalMinutes)) {
    if (totalMinutes <= 20) slots.add('breakfast');
    else slots.add('dinner');
  }
  return [...slots];
}

function dishTypes(name) {
  const n = normText(name);
  const pairs = [
    ['salad', /\bsalad\b/], ['soup', /\bsoup|stew\b/], ['cake', /\bcake|cheesecake\b/],
    ['cookie', /\bcookie|biscuit\b/], ['pastry', /\bpastry|tart|pie|croissant|danish\b/],
    ['dessert', /\bdessert|pudding|mousse|ice cream|gelato|sorbet\b/], ['drink', /\bshake|smoothie|juice|tea|coffee|latte|drink|punch\b/],
    ['bread', /\bbread|loaf|focaccia|naan|flatbread\b/], ['sauce', /\bsauce|vinaigrette|gravy\b/],
    ['dip', /\bdip|hummus|salsa\b/], ['appetizer', /\bappetizer|appetiser|starter|bruschetta|spring roll|dumpling\b/],
    ['side_dish', /\bside dish|coleslaw|slaw\b/], ['main_dish', /\bchicken|beef|steak|pasta|rice|curry|taco|pizza|burger|lasagna|casserole|roast|fish|salmon|shrimp|noodle|bowl\b/],
  ];
  return pairs.filter(([, re]) => re.test(n)).map(([slug]) => slug);
}

function profile(recipe, raw) {
  const prep = Number(recipe.prep_minutes), cook = Number(recipe.cook_minutes), total = Number(recipe.total_minutes);
  const ingredientCount = Array.isArray(raw?.cleaned_ingredients) ? raw.cleaned_ingredients.length : 0;
  const optionalIngredientCount = Array.isArray(raw?.cleaned_ingredients) ? raw.cleaned_ingredients.filter((x) => /\b(optional|to taste|as needed)\b/i.test(String(x))).length : 0;
  const instructions = rawText(raw, raw?.raw_instructions || '');
  const stepCount = Array.isArray(raw?.steps) ? raw.steps.length : (Array.isArray(raw?.instructions) ? raw.instructions.length : 0);
  const hasInstructions = instructions.length > 0 || stepCount > 0;
  const text = `${normText(recipe.name)} ${instructions}`;
  const equipment = detectEquipment(text), techniques = detectTechniques(text);
  const onePot = /\b(one pot|one-pot|single pot|single pan|sheet pan|skillet meal)\b/.test(text);
  const makeAhead = /\b(make ahead|make-ahead|ahead of time|refrigerate|freeze|freezer|overnight)\b/.test(text);
  const batchFriendly = /\b(batch|meal prep|meal-prep|serves \d+|freezer)\b/.test(text);
  const difficulty = normText(recipe.difficulty);
  const difficultyLevel = ['easy','medium','hard','advanced'].includes(difficulty) ? difficulty : (Number.isFinite(total) && total <= 30 && ingredientCount <= 10 ? 'easy' : null);
  let complexity = 0.5;
  if (Number.isFinite(total)) complexity += Math.min(total, 180) / 180 * 0.2;
  if (ingredientCount) complexity += Math.min(ingredientCount, 20) / 20 * 0.15;
  if (equipment.length >= 3) complexity += 0.08;
  if (techniques.length >= 3) complexity += 0.07;
  complexity = Math.max(0, Math.min(1, complexity));
  const quick = Number.isFinite(total) ? total <= 30 : difficultyLevel === 'easy';
  return {
    classification_version: VERSION,
    prep_time_bucket: bucket(prep), cook_time_bucket: bucket(cook), total_time_bucket: bucket(total),
    difficulty_level: difficultyLevel, complexity_score: Number(complexity.toFixed(3)), ingredient_count: ingredientCount,
    optional_ingredient_count: optionalIngredientCount, step_count: stepCount, has_instructions: hasInstructions,
    quick_easy: quick, make_ahead: makeAhead, one_pot: onePot, batch_friendly: batchFriendly,
    meal_slots: mealSlots(recipe.name, total), dish_types: dishTypes(recipe.name), techniques, equipment,
    time_confidence: Number.isFinite(total) ? 0.98 : 0.45,
    source: VERSION,
    evidence: { total_minutes: Number.isFinite(total) ? total : null, prep_minutes: Number.isFinite(prep) ? prep : null, cook_minutes: Number.isFinite(cook) ? cook : null, ingredient_count: ingredientCount, step_count: stepCount }
  };
}

async function main() {
  let recipes = await allRows('recipes', 'id,name,prep_minutes,cook_minutes,total_minutes,difficulty', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_instructions,raw_payload', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((x) => [x.recipe_id, { ...(x.raw_payload || {}), raw_instructions: x.raw_instructions }]));
  let processed = 0;
  for (let i = 0; i < recipes.length; i += BATCH) {
    for (const recipe of recipes.slice(i, i + BATCH)) {
      const p = profile(recipe, rawByRecipe.get(recipe.id) || {});
      await rest('recipe_intelligence_profiles', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, ...p }) });
      processed += 1;
    }
    console.log(JSON.stringify({ progress: processed, total: recipes.length }, null, 2));
  }
  console.log(JSON.stringify({ status: 'complete', processed, total: recipes.length, version: VERSION }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
