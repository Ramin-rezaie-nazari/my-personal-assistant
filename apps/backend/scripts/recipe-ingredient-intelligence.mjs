import { URL } from 'node:url';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_INGREDIENT_LIMIT || '0'), 0);
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_INGREDIENT_BATCH || '200'), 25), 500);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_INGREDIENT_DRY_RUN || 'false');
const VERSION = 'ingredient-intelligence-v1';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) { await sleep(500 * 2 ** i); continue; }
      throw new Error(`${response.status} ${path}: ${text}`);
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(500 * 2 ** i);
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

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text.replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return text
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(/',\s*'|",\s*"/)
      .map((x) => x.replace(/^['\"]|['\"]$/g, '').trim())
      .filter(Boolean);
  }
}

const UNITS = /\b(oz|ounce|ounces|lb|lbs|pound|pounds|kg|g|gram|grams|ml|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|dash|clove|cloves|can|cans|package|packages|pkg|stick|sticks|slice|slices|piece|pieces)\b/g;
const QUANTITY = /^\s*(?:about\s+)?(?:\d+[\d\s./-]*|\d+\s+\d+\/\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;
const PREP = /\([^)]*\)|\b(?:finely|coarsely|roughly|thinly|thickly|freshly|lightly|heaping|packed|divided|melted|softened|chopped|diced|minced|sliced|grated|shredded|peeled|seeded|cored|boneless|skinless|fresh|dried|ground|crushed|toasted|roasted|cooked|uncooked|optional|to taste|as needed|for garnish|for serving)\b/gi;

function canonicalize(line) {
  let x = norm(line);
  x = x.replace(QUANTITY, '');
  x = x.replace(UNITS, ' ');
  x = x.replace(PREP, ' ');
  x = x.replace(/\b(?:such as|like)\b.*$/i, ' ');
  x = x.replace(/\*+$/g, '');
  x = x.replace(/\s+/g, ' ').trim();

  const aliases = [
    [/\bextra virgin olive oil\b|\bevoo\b/, 'olive oil'],
    [/\bwhole milk\b|\bfull fat milk\b/, 'milk'],
    [/\bgreek yogurt\b|\bplain greek yogurt\b/, 'yogurt'],
    [/\bchicken breasts?\b/, 'chicken breast'],
    [/\bchicken thighs?\b/, 'chicken thigh'],
    [/\bground beef\b/, 'beef'],
    [/\bground turkey\b/, 'turkey'],
    [/\bgarlic cloves?\b/, 'garlic'],
    [/\bgreen onions?\b|\bscallions?\b/, 'scallion'],
    [/\bcilantro leaves?\b|\bfresh cilantro\b/, 'cilantro'],
    [/\bchili powder\b|\bchilli powder\b/, 'chili powder'],
    [/\bsoy bean sauce\b|\bsoya sauce\b/, 'soy sauce'],
  ];
  for (const [re, replacement] of aliases) x = x.replace(re, replacement);
  return x.replace(/\s+/g, ' ').trim();
}

const GROUPS = {
  poultry: [/\bchicken\b|\bturkey\b|\bduck\b/],
  meat: [/\bbeef\b|\bpork\b|\blamb\b|\bveal\b|\bham\b|\bbacon\b|\bsausage\b|\bprosciutto\b/],
  seafood: [/\bsalmon\b|\btuna\b|\bshrimp\b|\bprawn\b|\bcrab\b|\blobster\b|\banchov\w*\b|\bsardine\b|\bmussel\b|\bclam\b|\bsquid\b|\bscallop\b|\bfish\b/],
  dairy: [/\bmilk\b|\bcheese\b|\bbutter\b|\bcream\b|\byogurt\b|\bmozzarella\b|\bparmesan\b|\bcheddar\b|\bfeta\b/],
  egg: [/\begg\b/],
  grain: [/\brice\b|\bquinoa\b|\boat\b|\bbarley\b|\bbuckwheat\b|\bcouscous\b|\bpasta\b|\bnoodle\b|\bflour\b|\bbread\b|\btortilla\b/],
  legume: [/\bchickpea\b|\blentil\b|\bbean\b|\bpea\b|\bsoy\b|\btofu\b/],
  vegetable: [/\bonion\b|\bgarlic\b|\btomato\b|\bpepper\b|\bcarrot\b|\bcelery\b|\bspinach\b|\bkale\b|\bbroccoli\b|\beggplant\b|\bzucchini\b|\bcucumber\b|\bpotato\b|\bcabbage\b|\blettuce\b|\bmushroom\b|\bradish\b|\bturnip\b|\brutabaga\b/],
  fruit: [/\bapple\b|\bbanana\b|\borange\b|\blemon\b|\blime\b|\bcherry\b|\bberry\b|\bpeach\b|\bpear\b|\bmango\b|\bpineapple\b|\bgrape\b|\braisin\b|\bdate\b|\bfig\b/],
  nut_seed: [/\balmond\b|\bwalnut\b|\bpecan\b|\bpistachio\b|\bpeanut\b|\bcashew\b|\bhazelnut\b|\bsesame\b|\btahini\b|\bpumpkin seed\b|\bsunflower seed\b/],
  oil_fat: [/\boil\b|\blard\b|\bghee\b|\bshortening\b/],
  herb_spice: [/\bbasil\b|\boregano\b|\bthyme\b|\brosemary\b|\bparsley\b|\bcilantro\b|\bcumin\b|\bcoriander\b|\bpaprika\b|\bturmeric\b|\bginger\b|\bcinnamon\b|\bcardamom\b|\bsaffron\b|\bchili\b|\bpepper\b|\bsumac\b|\bzaatar\b|\bgaram masala\b/],
  condiment: [/\bsoy sauce\b|\bmustard\b|\bmayonnaise\b|\bvinegar\b|\bketchup\b|\bsalsa\b|\bhummus\b|\bharissa\b|\bhot sauce\b/],
  sweetener: [/\bsugar\b|\bhoney\b|\bmaple syrup\b|\bagave\b/],
};

function groupsFor(name) {
  return Object.entries(GROUPS).filter(([, rules]) => rules.some((re) => re.test(name))).map(([group]) => group);
}

function flags(names) {
  const text = names.join(' | ');
  return {
    vegan_possible: !/\b(chicken|turkey|duck|beef|pork|lamb|veal|ham|bacon|sausage|prosciutto|fish|salmon|tuna|shrimp|prawn|crab|lobster|mussel|clam|squid|scallop|milk|cheese|butter|cream|yogurt|egg|honey)\b/.test(text),
    vegetarian_possible: !/\b(chicken|turkey|duck|beef|pork|lamb|veal|ham|bacon|sausage|prosciutto|fish|salmon|tuna|shrimp|prawn|crab|lobster|mussel|clam|squid|scallop)\b/.test(text),
    contains_animal_meat: /\b(chicken|turkey|duck|beef|pork|lamb|veal|ham|bacon|sausage|prosciutto)\b/.test(text),
    contains_seafood: /\b(fish|salmon|tuna|shrimp|prawn|crab|lobster|mussel|clam|squid|scallop)\b/.test(text),
    contains_dairy: /\b(milk|cheese|butter|cream|yogurt)\b/.test(text),
    contains_egg: /\begg\b/.test(text),
    contains_nut_seed: /\b(almond|walnut|pecan|pistachio|peanut|cashew|hazelnut|sesame|tahini)\b/.test(text),
    contains_gluten_candidate: /\b(wheat|flour|bread|pasta|noodle|barley|couscous|cracker|breadcrumbs)\b/.test(text),
  };
}

function analyze(rawIngredients) {
  const raw = parseArray(rawIngredients);
  const canonical = raw.map(canonicalize).filter(Boolean);
  const unique = [...new Set(canonical)];
  const ingredientGroups = Object.fromEntries(unique.map((name) => [name, groupsFor(name)]));
  return {
    version: VERSION,
    raw_count: raw.length,
    canonical_count: unique.length,
    ingredients: unique.map((name) => ({ name, groups: ingredientGroups[name] })),
    flags: flags(unique),
    confidence: raw.length ? Number(Math.min(0.99, 0.62 + Math.min(raw.length, 20) / 20 * 0.30).toFixed(2)) : 0,
  };
}

async function main() {
  let recipes = await allRows('recipes', 'id,name', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((x) => [x.recipe_id, x.raw_ingredients]));
  let processed = 0;
  let withIngredients = 0;
  for (let i = 0; i < recipes.length; i += BATCH) {
    const batch = recipes.slice(i, i + BATCH);
    for (const recipe of batch) {
      const analysis = analyze(rawByRecipe.get(recipe.id));
      if (analysis.raw_count) withIngredients += 1;
      if (!DRY_RUN) {
        const existing = await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipe.id}&select=evidence&limit=1`);
        const evidence = existing?.[0]?.evidence && typeof existing[0].evidence === 'object' ? existing[0].evidence : {};
        await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipe.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ source: 'ingredient-intelligence', evidence: { ...evidence, ingredient_intelligence: analysis } }),
        });
      }
      processed += 1;
    }
    console.log(JSON.stringify({ progress: processed, total: recipes.length, withIngredients }, null, 2));
  }
  console.log(JSON.stringify({ status: 'complete', mode: DRY_RUN ? 'dry-run' : 'apply', processed, total: recipes.length, withIngredients, version: VERSION }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
