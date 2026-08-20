import fs from 'node:fs/promises';
import path from 'node:path';

process.env.RECIPE_COUNTRY_DRY_RUN = 'true';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_COUNTRY_LIMIT || '0'), 0);
const AUDIT = /^(1|true|yes)$/i.test(process.env.RECIPE_COUNTRY_AUDIT || 'false');
const VERSION = 'country-rules-v7-source';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(pathname, attempts = 6) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { headers });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw new Error(`${response.status} ${pathname}: ${text}`);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function allRows(table, select, order = 'id.asc') {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) return rows;
  }
}

function stripV6Main(source) {
  const mainIndex = source.indexOf('\nmain().catch');
  if (mainIndex < 0) throw new Error('Could not locate V6 main() entrypoint.');
  return `${source.slice(0, mainIndex)}\nexport { infer as inferCountry };\n`;
}

async function loadV6Infer() {
  const v6Path = path.join(path.dirname(new URL(import.meta.url).pathname), 'recipe-country-intelligence-v6.mjs');
  const source = await fs.readFile(v6Path, 'utf8');
  const moduleSource = stripV6Main(source);
  const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(moduleSource)}`;
  const module = await import(dataUrl);
  if (typeof module.inferCountry !== 'function') throw new Error('V6 inference function was not exposed.');
  return module.inferCountry;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

async function main() {
  const inferCountry = await loadV6Infer();

  let recipes = await allRows(
    'recipes',
    'id,name,native_name,description,cuisine,source_name,source_recipe_id,source_external_id',
    'created_at.asc',
  );
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);

  const [rawRows, ingredientRows, stepRows] = await Promise.all([
    allRows('recipe_source_raw', 'recipe_id,raw_ingredients,raw_instructions,image_name', 'recipe_id.asc'),
    allRows('recipe_ingredients', 'recipe_id,ingredient_name,preparation', 'recipe_id.asc'),
    allRows('recipe_steps', 'recipe_id,title,instructions', 'recipe_id.asc'),
  ]);

  const rawByRecipe = new Map();
  for (const row of rawRows) rawByRecipe.set(row.recipe_id, row);

  const ingredientsByRecipe = new Map();
  for (const row of ingredientRows) {
    const list = ingredientsByRecipe.get(row.recipe_id) || [];
    if (row.ingredient_name) list.push(`${row.ingredient_name}${row.preparation ? ` ${row.preparation}` : ''}`);
    ingredientsByRecipe.set(row.recipe_id, list);
  }

  const stepsByRecipe = new Map();
  for (const row of stepRows) {
    const list = stepsByRecipe.get(row.recipe_id) || [];
    if (row.title) list.push(row.title);
    if (row.instructions) list.push(row.instructions);
    stepsByRecipe.set(row.recipe_id, list);
  }

  const counts = { origin: 0, traditional: 0, associated: 0, popular: 0 };
  const audit = [];
  let countryRelations = 0;
  let globalRecipes = 0;
  let unknownRecipes = 0;
  let rawEvidenceRecipes = 0;
  let ingredientEvidenceRecipes = 0;
  let stepEvidenceRecipes = 0;
  const unknownReasons = {};

  for (const recipe of recipes) {
    const raw = rawByRecipe.get(recipe.id);
    const ingredients = ingredientsByRecipe.get(recipe.id) || [];
    const steps = stepsByRecipe.get(recipe.id) || [];

    const sourceEvidence = [
      raw?.raw_ingredients,
      raw?.raw_instructions,
      ingredients.join(' '),
      steps.join(' '),
    ].filter(Boolean);

    if (sourceEvidence.length) rawEvidenceRecipes += 1;
    if (ingredients.length) ingredientEvidenceRecipes += 1;
    if (steps.length) stepEvidenceRecipes += 1;

    // Feed source evidence into the already-audited V6 inference engine without mutating DB fields.
    const enriched = {
      ...recipe,
      description: normalizeText([
        recipe.description,
        raw?.raw_ingredients,
        raw?.raw_instructions,
        ingredients.join(' '),
        steps.join(' '),
      ].filter(Boolean).join(' ')),
    };

    const result = inferCountry(enriched);
    countryRelations += result.relations.length;
    for (const relation of result.relations) counts[relation.type || relation.relation_type] += 1;

    if (result.global) globalRecipes += 1;

    let unknownReason = result.unknownReason || null;
    if (result.unknown && sourceEvidence.length) unknownReason = 'insufficient_cultural_evidence_after_source_review';
    if (result.unknown) {
      unknownRecipes += 1;
      unknownReasons[unknownReason || 'unknown'] = (unknownReasons[unknownReason || 'unknown'] || 0) + 1;
    }

    if (AUDIT) {
      audit.push({
        id: recipe.id,
        name: recipe.name,
        cuisine: recipe.cuisine,
        sourceName: recipe.source_name,
        hasRawSource: Boolean(raw),
        ingredientCount: ingredients.length,
        stepCount: steps.length,
        global: result.global,
        globalConfidence: result.globalConfidence,
        globalEvidence: result.globalEvidence,
        unknown: result.unknown,
        unknownReason,
        relations: result.relations,
      });
    }
  }

  console.log(JSON.stringify({
    status: 'complete',
    mode: 'dry-run',
    recipesProcessed: recipes.length,
    countryRelations,
    relationCounts: counts,
    globalRecipes,
    unknownRecipes,
    unknownReasons,
    evidenceCoverage: {
      rawEvidenceRecipes,
      ingredientEvidenceRecipes,
      stepEvidenceRecipes,
    },
    version: VERSION,
    ...(AUDIT ? { audit } : {}),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
