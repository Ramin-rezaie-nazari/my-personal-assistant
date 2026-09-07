const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_BYTES = 64 * 1024;
const APPROVED_SOURCES = /Food Ingredients and Recipes Dataset with Images|Wikimedia Commons/i;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function getJson(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${text}`);
  return text ? JSON.parse(text) : [];
}

async function page(table, select, extra = '') {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const suffix = `select=${select}&limit=1000&offset=${offset}${extra ? `&${extra}` : ''}`;
    const chunk = await getJson(`${table}?${suffix}`);
    rows.push(...chunk);
    if (chunk.length < 1000) return rows;
  }
}

async function main() {
  const recipes = await page('recipes', 'id');
  const heroes = await page('recipe_images', 'recipe_id,mime_type,byte_size,image_url,storage_key,source_name,source_url,source_license', 'image_type=eq.hero&order=recipe_id.asc');
  const counts = new Map();
  for (const row of heroes) counts.set(row.recipe_id, (counts.get(row.recipe_id) ?? 0) + 1);
  const duplicateRecipeIds = [...counts.entries()].filter(([, count]) => count !== 1).map(([id]) => id);
  const missingRecipeIds = recipes.map((r) => r.id).filter((id) => !counts.has(id));
  const extraRecipeIds = [...counts.keys()].filter((id) => !new Set(recipes.map((r) => r.id)).has(id));
  const invalid = heroes.filter((row) =>
    row.mime_type !== 'image/webp' ||
    Number(row.byte_size ?? 0) <= 0 || Number(row.byte_size ?? 0) > MAX_BYTES ||
    !/\/hero\.webp(?:$|\?)/i.test(String(row.storage_key ?? '')) ||
    !/\/hero\.webp(?:$|\?)/i.test(String(row.image_url ?? '')) ||
    !APPROVED_SOURCES.test(String(row.source_name ?? '')) ||
    (!row.source_url && !row.storage_key)
  );
  const generated = heroes.filter((row) => /generated|illustration|svg/i.test(`${row.source_name ?? ''} ${row.source_license ?? ''} ${row.storage_key ?? ''}`));
  const report = {
    recipes: recipes.length,
    heroRows: heroes.length,
    recipesWithExactlyOneHero: recipes.filter((r) => counts.get(r.id) === 1).length,
    missing: missingRecipeIds.length,
    duplicates: duplicateRecipeIds.length,
    extraHeroRecipeIds: extraRecipeIds.length,
    invalid: invalid.length,
    generatedLike: generated.length,
    maxBytes: MAX_BYTES,
    complete: recipes.length > 0 && heroes.length === recipes.length && missingRecipeIds.length === 0 && duplicateRecipeIds.length === 0 && extraRecipeIds.length === 0 && invalid.length === 0 && generated.length === 0,
  };
  console.log(JSON.stringify({ report, missingRecipeIds: missingRecipeIds.slice(0, 50), duplicateRecipeIds: duplicateRecipeIds.slice(0, 50), invalidExamples: invalid.slice(0, 20) }, null, 2));
  if (!report.complete) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
