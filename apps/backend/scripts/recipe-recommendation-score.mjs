const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_SCORE_LIMIT || '0'), 0);
const TOP = Math.min(Math.max(Number(process.env.RECIPE_SCORE_TOP || '20'), 1), 100);
const USER = JSON.parse(process.env.RECIPE_USER_JSON || '{}');

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(path, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : [];
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

const norm = (v) => String(v || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const overlap = (a = [], b = []) => {
  const B = new Set(b.map(norm));
  return a.filter((x) => B.has(norm(x)));
};
const fuzzySetMatch = (value, set = []) => set.some((x) => norm(value).includes(norm(x)) || norm(x).includes(norm(value)));

function targetFit(actual, target, tolerance) {
  if (!Number.isFinite(actual) || !Number.isFinite(target) || target <= 0) return 0.5;
  const distance = Math.abs(actual - target) / Math.max(target, tolerance || target);
  return clamp(1 - distance);
}

function ingredientFit(ingredientNames = [], user = {}) {
  const available = (user.available_ingredients || []).map(norm);
  const avoid = (user.disliked_ingredients || user.avoid_ingredients || []).map(norm);
  if (!ingredientNames.length) return { score: 0.5, matched: [], missing: [], avoided: [] };

  const normalized = ingredientNames.map(norm);
  const matched = normalized.filter((x) => available.some((a) => x.includes(a) || a.includes(x)));
  const avoided = normalized.filter((x) => avoid.some((a) => x.includes(a) || a.includes(x)));
  const missing = normalized.filter((x) => !matched.includes(x)).slice(0, 8);
  const availability = available.length ? matched.length / Math.max(1, normalized.length) : 0.5;
  const penalty = avoided.length ? Math.min(1, avoided.length * 0.25) : 0;
  return { score: clamp(availability * 0.75 + 0.25 - penalty), matched, missing, avoided };
}

function dietaryFit(flags = {}, user = {}) {
  const diets = new Set((user.diets || user.dietary_preferences || []).map(norm));
  const reasons = [];
  if (diets.has('vegan') && !flags.vegan_possible) return { score: 0, reason: 'not vegan-compatible' };
  if (diets.has('vegetarian') && !flags.vegetarian_possible) return { score: 0, reason: 'not vegetarian-compatible' };
  if (diets.has('dairy-free') && flags.contains_dairy) return { score: 0, reason: 'contains dairy' };
  if (diets.has('egg-free') && flags.contains_egg) return { score: 0, reason: 'contains egg' };
  if ((diets.has('nut-free') || diets.has('sesame-free')) && flags.contains_nut_seed) return { score: 0, reason: 'contains nut/seed signal' };
  if (diets.has('gluten-free') && flags.contains_gluten_candidate) return { score: 0, reason: 'contains gluten candidate' };
  return { score: 1, reason: null };
}

function cuisineFit(recipe, user) {
  const wanted = user.preferred_cuisines || user.liked_cuisines || [];
  const disliked = user.disliked_cuisines || [];
  const cuisine = norm(recipe.cuisine);
  if (!cuisine && !wanted.length && !disliked.length) return { score: 0.5, reason: null };
  if (disliked.some((x) => cuisine.includes(norm(x)))) return { score: 0, reason: 'disliked cuisine' };
  if (wanted.some((x) => cuisine.includes(norm(x)))) return { score: 1, reason: `preferred cuisine: ${wanted.find((x) => cuisine.includes(norm(x)))}` };
  return { score: wanted.length ? 0.45 : 0.6, reason: null };
}

function globalCultureFit(recipe, relations, user) {
  const preferredCountries = user.preferred_countries || user.countries || [];
  const preferredRegions = user.preferred_regions || [];
  const preferred = preferredCountries.map((x) => norm(x));
  const relationHit = relations.some((r) => preferred.includes(norm(r.iso2)) || preferred.includes(norm(r.country)));
  if (relationHit) return 1;
  if (preferredRegions.length && relations.some((r) => preferredRegions.some((region) => norm(region) === norm(r.region)))) return 1;
  if (recipe.is_global) return 0.85;
  return 0.55;
}

function scoreRecipe(recipe, profile, relations, user) {
  const evidence = profile?.evidence?.ingredient_intelligence || {};
  const ingredientNames = Array.isArray(evidence.ingredients) ? evidence.ingredients.map((x) => x.name) : [];
  const flags = evidence.flags || {};
  const ingredient = ingredientFit(ingredientNames, user);
  const dietary = dietaryFit(flags, user);
  const cuisine = cuisineFit(recipe, user);
  const culture = globalCultureFit(recipe, relations, user);
  const maxMinutes = Number(user.max_minutes || user.available_minutes);
  const total = Number(recipe.total_minutes);
  const time = Number.isFinite(maxMinutes) && maxMinutes > 0 && Number.isFinite(total) ? clamp(1 - Math.max(0, total - maxMinutes) / maxMinutes) : 0.6;
  const kcalTarget = Number(user.remaining_kcal || user.target_kcal);
  const proteinTarget = Number(user.remaining_protein_g || user.target_protein_g);
  const kcal = Number(recipe.kcal_per_serving);
  const protein = Number(recipe.protein_g_per_serving);
  const nutrition = (targetFit(kcal, kcalTarget, 150) + targetFit(protein, proteinTarget, 10)) / 2;
  const difficultyPref = user.difficulty ? norm(user.difficulty) : null;
  const difficulty = difficultyPref && recipe.difficulty ? (norm(recipe.difficulty) === difficultyPref ? 1 : 0.55) : 0.6;
  const quality = Number(recipe.quality_score) > 0 ? clamp(Number(recipe.quality_score) / 100) : 0.6;
  const repeatPenalty = (user.recent_recipe_ids || []).includes(recipe.id) ? 1 : 0;
  const recentPenalty = repeatPenalty ? 0 : 1;
  const weights = { nutrition: 0.24, ingredients: 0.22, dietary: 0.18, cuisine: 0.10, culture: 0.08, time: 0.08, difficulty: 0.04, quality: 0.04, novelty: 0.02 };
  const score = 100 * (
    weights.nutrition * nutrition +
    weights.ingredients * ingredient.score +
    weights.dietary * dietary.score +
    weights.cuisine * cuisine.score +
    weights.culture * culture +
    weights.time * time +
    weights.difficulty * difficulty +
    weights.quality * quality +
    weights.novelty * recentPenalty
  );
  const reasons = [];
  if (ingredient.matched.length) reasons.push(`uses ${ingredient.matched.length} ingredients you already have`);
  if (dietary.score === 1 && (user.diets || user.dietary_preferences)?.length) reasons.push('fits dietary preferences');
  if (cuisine.reason) reasons.push(cuisine.reason);
  if (Number.isFinite(total) && Number.isFinite(maxMinutes) && total <= maxMinutes) reasons.push(`${total} min fits your time`);
  if (Number.isFinite(protein) && Number.isFinite(proteinTarget) && protein >= proteinTarget * 0.8) reasons.push('strong protein match');
  if (recipe.is_global) reasons.push('globally familiar option');
  return {
    recipe_id: recipe.id,
    name: recipe.name,
    score: Number(score.toFixed(2)),
    breakdown: {
      nutrition: Number(nutrition.toFixed(3)), ingredients: Number(ingredient.score.toFixed(3)), dietary: Number(dietary.score.toFixed(3)),
      cuisine: Number(cuisine.score.toFixed(3)), culture: Number(culture.toFixed(3)), time: Number(time.toFixed(3)),
      difficulty: Number(difficulty.toFixed(3)), quality: Number(quality.toFixed(3)), novelty: recentPenalty,
    },
    reasons: reasons.slice(0, 5),
    matched_ingredients: ingredient.matched.slice(0, 8),
    missing_ingredients: ingredient.missing,
    avoided_ingredients: ingredient.avoided,
  };
}

async function main() {
  let recipes = await allRows('recipes', 'id,name,cuisine,total_minutes,difficulty,kcal_per_serving,protein_g_per_serving,quality_score,is_global', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const ids = recipes.map((r) => r.id);
  const profiles = await allRows('recipe_intelligence_profiles', 'recipe_id,evidence,source,updated_at', 'updated_at.desc');
  const profileByRecipe = new Map();
  for (const row of profiles) if (!profileByRecipe.has(row.recipe_id)) profileByRecipe.set(row.recipe_id, row);
  const relations = ids.length ? await allRows('recipe_country_relations', 'recipe_id,country_id,relation_type,confidence,evidence', 'recipe_id.asc') : [];
  const relationByRecipe = new Map();
  for (const row of relations) (relationByRecipe.get(row.recipe_id) || relationByRecipe.set(row.recipe_id, []).get(row.recipe_id)).push(row);
  const scored = recipes.map((recipe) => scoreRecipe(recipe, profileByRecipe.get(recipe.id), relationByRecipe.get(recipe.id) || [], USER));
  scored.sort((a, b) => b.score - a.score);
  console.log(JSON.stringify({ status: 'complete', recipes: scored.length, user: USER, top: scored.slice(0, TOP) }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
