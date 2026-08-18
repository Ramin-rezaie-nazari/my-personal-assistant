import fs from 'node:fs/promises';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INPUT = process.env.RECIPE_INPUT || './recipe-candidates.jsonl';
const MIN_SCORE = Number(process.env.RECIPE_MIN_SCORE || '0.82');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

function norm(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function scoreRecipe(recipe) {
  const flags = [];
  let score = 0;
  if (nonEmpty(recipe.name)) score += 0.12; else flags.push('missing_name');
  if (nonEmpty(recipe.description) && recipe.description.length >= 40) score += 0.06; else flags.push('weak_description');
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  if (ingredients.length >= 4) score += 0.18; else flags.push('too_few_ingredients');
  if (ingredients.every((x) => nonEmpty(x.name) && Number(x.quantity) > 0)) score += 0.14; else flags.push('bad_ingredient_quantities');
  if (steps.length >= 3) score += 0.18; else flags.push('too_few_steps');
  if (steps.every((x) => nonEmpty(x.instructions) && x.instructions.length >= 20)) score += 0.16; else flags.push('weak_steps');
  if (Number(recipe.servings) > 0) score += 0.05; else flags.push('missing_servings');
  if (Number(recipe.total_minutes) > 0) score += 0.04; else flags.push('missing_time');
  if (recipe.nutrition && Number(recipe.nutrition.kcal_per_serving) > 0) score += 0.07; else flags.push('missing_nutrition');

  const text = `${recipe.name} ${recipe.description || ''} ${steps.map((x) => x.instructions).join(' ')}`.toLowerCase();
  if (/test recipe|placeholder|lorem ipsum|click here|unknown|tbd/.test(text)) flags.push('spam_or_placeholder');

  if (flags.includes('spam_or_placeholder')) score = Math.min(score, 0.2);
  return { score: Number(score.toFixed(4)), flags };
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body}`);
  return body ? JSON.parse(body) : null;
}

async function main() {
  const raw = await fs.readFile(INPUT, 'utf8');
  const candidates = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const seen = new Set();
  let accepted = 0;
  let rejected = 0;

  for (const recipe of candidates) {
    const key = `${norm(recipe.name)}|${(recipe.ingredients || []).map((x) => norm(x.name)).sort().join('|')}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const quality = scoreRecipe(recipe);
    const source = recipe.source || {};

    const qualityStatus = quality.score >= MIN_SCORE ? 'accepted' : 'rejected';
    if (qualityStatus === 'rejected') {
      rejected += 1;
      continue;
    }

    if (!source.name || source.production_allowed !== true) {
      rejected += 1;
      continue;
    }

    const [existing] = await supabase(`recipes?select=id&source_name=eq.${encodeURIComponent(source.name)}&source_recipe_id=eq.${encodeURIComponent(String(recipe.source_recipe_id || ''))}&limit=1`);
    if (existing) continue;

    const [row] = await supabase('recipes', {
      method: 'POST',
      body: JSON.stringify({
        name: recipe.name,
        slug: recipe.slug || `${norm(recipe.name).replace(/ /g, '-')}-${recipe.source_recipe_id || Date.now()}`,
        native_name: recipe.native_name || null,
        description: recipe.description || null,
        cuisine: recipe.cuisine || null,
        prep_minutes: recipe.prep_minutes || null,
        cook_minutes: recipe.cook_minutes || null,
        total_minutes: recipe.total_minutes || null,
        difficulty: recipe.difficulty || null,
        servings: recipe.servings || 1,
        yield_weight_g: recipe.yield_weight_g || null,
        kcal_total: recipe.nutrition?.kcal_total || null,
        protein_g_total: recipe.nutrition?.protein_g_total || null,
        fat_g_total: recipe.nutrition?.fat_g_total || null,
        carbs_g_total: recipe.nutrition?.carbs_g_total || null,
        fiber_g_total: recipe.nutrition?.fiber_g_total || null,
        sugar_g_total: recipe.nutrition?.sugar_g_total || null,
        saturated_fat_g_total: recipe.nutrition?.saturated_fat_g_total || null,
        sodium_mg_total: recipe.nutrition?.sodium_mg_total || null,
        kcal_per_serving: recipe.nutrition?.kcal_per_serving || null,
        protein_g_per_serving: recipe.nutrition?.protein_g_per_serving || null,
        fat_g_per_serving: recipe.nutrition?.fat_g_per_serving || null,
        carbs_g_per_serving: recipe.nutrition?.carbs_g_per_serving || null,
        fiber_g_per_serving: recipe.nutrition?.fiber_g_per_serving || null,
        sugar_g_per_serving: recipe.nutrition?.sugar_g_per_serving || null,
        saturated_fat_g_per_serving: recipe.nutrition?.saturated_fat_g_per_serving || null,
        sodium_mg_per_serving: recipe.nutrition?.sodium_mg_per_serving || null,
        nutrition_source: recipe.nutrition?.source || null,
        nutrition_confidence: recipe.nutrition?.confidence ?? null,
        status: 'reviewed',
        source_name: source.name,
        source_url: source.url || null,
        source_license: source.license || null,
        source_attribution: source.attribution || null,
        source_recipe_id: recipe.source_recipe_id ? String(recipe.source_recipe_id) : null,
        quality_score: quality.score,
        quality_status: 'accepted',
        quality_flags: quality.flags,
      }),
    });

    for (const [index, ingredient] of (recipe.ingredients || []).entries()) {
      await supabase('recipe_ingredients', {
        method: 'POST',
        body: JSON.stringify({
          recipe_id: row.id,
          ingredient_name: ingredient.name,
          quantity: ingredient.quantity,
          grams: ingredient.grams ?? null,
          preparation: ingredient.preparation || null,
          optional: Boolean(ingredient.optional),
          sort_order: index,
        }),
      });
    }

    for (const [index, step] of (recipe.steps || []).entries()) {
      await supabase('recipe_steps', {
        method: 'POST',
        body: JSON.stringify({
          recipe_id: row.id,
          step_number: index + 1,
          title: step.title || null,
          instructions: step.instructions,
          duration_minutes: step.duration_minutes ?? null,
          temperature_c: step.temperature_c ?? null,
        }),
      });
    }

    await supabase('recipe_quality_reviews', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        recipe_id: row.id,
        score: quality.score,
        status: 'accepted',
        flags: quality.flags,
        reviewer_type: 'automated',
      }),
    });

    accepted += 1;
  }

  console.log(JSON.stringify({ accepted, rejected, seen: seen.size }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
