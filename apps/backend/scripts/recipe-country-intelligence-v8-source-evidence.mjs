const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const originalFetch = globalThis.fetch;

async function rest(pathname) {
  const response = await originalFetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${pathname}: ${text}`);
  return text ? JSON.parse(text) : [];
}

async function paged(table, select) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`${table}?select=${select}&order=id.asc&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) return rows;
  }
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function evidenceTags(raw) {
  const text = normalize(raw);
  const tags = [];
  const any = (...values) => values.some((value) => text.includes(value));
  const all = (...values) => values.every((value) => text.includes(value));

  if (any('zaatar', 'sumac', 'tahini', 'pomegranate molasses') && any('chickpea', 'eggplant', 'yogurt', 'parsley', 'cucumber')) tags.push('levantine');
  if (any('miso', 'dashi') && any('mirin', 'sake', 'rice vinegar', 'soy sauce')) tags.push('japanese');
  if (any('galangal', 'kaffir lime', 'thai basil') && any('fish sauce', 'coconut milk')) tags.push('thai');
  if (any('lemongrass', 'nuoc mam', 'fish sauce') && any('rice noodles', 'rice paper', 'hoisin')) tags.push('vietnamese');
  if (any('garam masala', 'curry leaves') && any('turmeric', 'cumin', 'coriander')) tags.push('indian');
  if (any('masa harina', 'corn tortilla', 'tomatillo', 'chipotle', 'ancho chile', 'achiote') && any('cumin', 'lime', 'cilantro')) tags.push('mexican');
  if (any('ras el hanout', 'preserved lemon', 'harissa') && any('couscous', 'chickpea', 'tagine')) tags.push('moroccan');
  if (any('pesto', 'parmigiano', 'parmigiano-reggiano') && any('basil', 'olive oil')) tags.push('italian');
  if (any('dijon mustard', 'herbes de provence', 'creme fraiche') && any('shallot', 'tarragon', 'butter')) tags.push('french');
  if (any('gochujang', 'gochugaru', 'doenjang') || (any('kimchi') && any('sesame oil', 'scallion'))) tags.push('korean');
  if (all('saffron', 'preserved lemon', 'couscous')) tags.push('north african');
  if (any('cajun seasoning', 'andouille') && any('okra', 'celery', 'bell pepper')) tags.push('cajun');
  return [...new Set(tags)];
}

const [rawRows, ingredientRows, stepRows] = await Promise.all([
  paged('recipe_source_raw', 'recipe_id,raw_ingredients,raw_instructions'),
  paged('recipe_ingredients', 'recipe_id,ingredient_name'),
  paged('recipe_steps', 'recipe_id,instructions'),
]);

const rawByRecipe = new Map(rawRows.map((row) => [row.recipe_id, row]));
const ingredientsByRecipe = new Map();
for (const row of ingredientRows) {
  const list = ingredientsByRecipe.get(row.recipe_id) || [];
  list.push(row.ingredient_name);
  ingredientsByRecipe.set(row.recipe_id, list);
}
const stepsByRecipe = new Map();
for (const row of stepRows) {
  const list = stepsByRecipe.get(row.recipe_id) || [];
  list.push(row.instructions);
  stepsByRecipe.set(row.recipe_id, list);
}

function decorateRecipes(rows) {
  return rows.map((recipe) => {
    const raw = rawByRecipe.get(recipe.id) || {};
    const ingredients = ingredientsByRecipe.get(recipe.id) || [];
    const steps = stepsByRecipe.get(recipe.id) || [];
    const tags = evidenceTags([
      raw.raw_ingredients,
      raw.raw_instructions,
      ...ingredients,
      ...steps,
    ].filter(Boolean).join(' '));

    return {
      ...recipe,
      // V6 already understands regional/country tokens; this injects only
      // high-signal composite evidence derived from the raw recipe source.
      description: [recipe.description, tags.join(' ')].filter(Boolean).join(' '),
    };
  });
}

globalThis.fetch = async (input, init) => {
  const url = String(typeof input === 'string' ? input : input?.url || '');
  const response = await originalFetch(input, init);
  if (!url.includes('/rest/v1/recipes?')) return response;

  const rows = await response.clone().json();
  const decorated = decorateRecipes(Array.isArray(rows) ? rows : []);
  return new Response(JSON.stringify(decorated), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'content-type': 'application/json' },
  });
};

// V6 executes its main() on import. The fetch interceptor above must therefore
// be installed in this same process so the raw-source evidence reaches V6.
await import('./recipe-country-intelligence-v6.mjs');
