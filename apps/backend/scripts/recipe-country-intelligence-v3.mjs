import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROOT = process.env.RECIPE_COUNTRY_DATASET_DIR || path.resolve(process.cwd(), 'data');
const CSV = path.join(ROOT, 'countries-195.csv');
const LIMIT = Math.max(Number(process.env.RECIPE_COUNTRY_LIMIT || '0'), 0);
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_COUNTRY_BATCH || '200'), 25), 500);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_COUNTRY_DRY_RUN || 'false');
const AUDIT = /^(1|true|yes)$/i.test(process.env.RECIPE_COUNTRY_AUDIT || 'false');
const VERSION = 'country-rules-v3';
const V1_SOURCE = 'country-rules-v1';
const INTELLIGENCE_SOURCE = 'country-intelligence';
const SOURCE_REF = VERSION;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(pathname, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) { await sleep(500 * 2 ** i); continue; }
      throw new Error(`${response.status} ${pathname}: ${text}`);
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
    rows.push(...(page || []);
    if (!page || page.length < 1000) return rows;
  }
}

function norm(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function csvParse(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [iso2, iso3, name, continent, subregion] = lines[i].split(',');
    if (iso2 && iso3 && name) rows.push({ iso2, iso3, name, continent, subregion });
  }
  return rows;
}

const countryNameAliases = new Map([
  ['usa', 'US'], ['united states', 'US'], ['america', 'US'], ['american', 'US'],
  ['uk', 'GB'], ['britain', 'GB'], ['british', 'GB'], ['england', 'GB'],
  ['italian', 'IT'], ['italy', 'IT'], ['french', 'FR'], ['france', 'FR'],
  ['spanish', 'ES'], ['spain', 'ES'], ['german', 'DE'], ['germany', 'DE'],
  ['mexican', 'MX'], ['mexico', 'MX'], ['indian', 'IN'], ['india', 'IN'],
  ['chinese', 'CN'], ['china', 'CN'], ['japanese', 'JP'], ['japan', 'JP'],
  ['korean', 'KR'], ['korea', 'KR'], ['thai', 'TH'], ['thailand', 'TH'],
  ['vietnamese', 'VN'], ['vietnam', 'VN'], ['turkish', 'TR'], ['turkey', 'TR'],
  ['persian', 'IR'], ['iranian', 'IR'], ['iran', 'IR'], ['greek', 'GR'], ['greece', 'GR'],
  ['portuguese', 'PT'], ['portugal', 'PT'], ['moroccan', 'MA'], ['morocco', 'MA'],
  ['lebanese', 'LB'], ['lebanon', 'LB'], ['palestinian', 'PS'], ['palestine', 'PS'],
  ['egyptian', 'EG'], ['egypt', 'EG'], ['ethiopian', 'ET'], ['ethiopia', 'ET'],
  ['nigerian', 'NG'], ['nigeria', 'NG'], ['south african', 'ZA'], ['south africa', 'ZA'],
  ['brazilian', 'BR'], ['brazil', 'BR'], ['argentinian', 'AR'], ['argentina', 'AR'],
  ['peruvian', 'PE'], ['peru', 'PE'], ['colombian', 'CO'], ['colombia', 'CO'],
  ['jamaican', 'JM'], ['jamaica', 'JM'], ['cuban', 'CU'], ['cuba', 'CU'],
]);

const strongDishOrigins = [
  [/\b(neapolitan pizza|margherita pizza|pizza napoletana)\b/i, 'IT', 'signature dish name'],
  [/\b(carbonara|cacio e pepe|ossobuco|osso buco|risotto alla milanese|tiramisu)\b/i, 'IT', 'signature dish name'],
  [/\b(paella|gazpacho|tortilla espanola|churros)\b/i, 'ES', 'signature dish name'],
  [/\b(coq au vin|ratatouille|bouillabaisse|quiche lorraine|creme brulee)\b/i, 'FR', 'signature dish name'],
  [/\b(sushi|sashimi|ramen|tempura|okonomiyaki|miso soup)\b/i, 'JP', 'signature dish name'],
  [/\b(kimchi|bibimbap|bulgogi|tteokbokki)\b/i, 'KR', 'signature dish name'],
  [/\b(pad thai|tom yum|tom kha|green curry|massaman curry)\b/i, 'TH', 'signature dish name'],
  [/\b(pho|banh mi|bun cha|goi cuon|bun bo hue)\b/i, 'VN', 'signature dish name'],
  [/\b(tacos al pastor|mole poblano|chiles en nogada|pozole)\b/i, 'MX', 'signature dish name'],
  [/\b(biryani|dosa|idli|samosa|palak paneer|butter chicken|tandoori chicken)\b/i, 'IN', 'signature dish name'],
  [/\b(hummus|falafel|shakshuka)\b/i, 'PS', 'strong regional dish lexicon'],
  [/\b(tabouleh|tabbouleh|kibbeh)\b/i, 'LB', 'strong regional dish lexicon'],
  [/\b(couscous|tagine|tajine)\b/i, 'MA', 'signature dish name'],
  [/\b(jollof rice)\b/i, 'NG', 'strong regional dish lexicon'],
  [/\b(injera|doro wat|doro wot)\b/i, 'ET', 'signature dish name'],
  [/\b(feijoada|brigadeiro|pao de queijo)\b/i, 'BR', 'signature dish name'],
  [/\b(ceviche|lomo saltado|aji de gallina)\b/i, 'PE', 'signature dish name'],
  [/\b(asado|empanadas? argentinas)\b/i, 'AR', 'signature dish name'],
  [/\b(goulash)\b/i, 'HU', 'signature dish name'],
  [/\b(moussaka|spanakopita)\b/i, 'GR', 'signature dish name'],
  [/\b(kebab|doner|doner kebab|lahmacun|baklava)\b/i, 'TR', 'signature dish name'],
  [/\b(sauerbraten|bratwurst|pretzel|kartoffelpuffer)\b/i, 'DE', 'signature dish name'],
  [/\b(fish and chips|shepherds? pie|beef wellington|sticky toffee pudding)\b/i, 'GB', 'signature dish name'],
  [/\b(poutine|tourtiere)\b/i, 'CA', 'signature dish name'],
  [/\b(hainanese chicken rice)\b/i, 'SG', 'signature dish name'],
  [/\b(nasi goreng|rendang|gado gado|gado-gado|satay|sate ayam)\b/i, 'ID', 'signature dish name'],
  [/\b(nasi lemak|laksa|char kway teow)\b/i, 'MY', 'signature dish name'],
  [/\b(adobo|sinigang|pancit)\b/i, 'PH', 'signature dish name'],
  [/\b(amok trey|lok lak)\b/i, 'KH', 'signature dish name'],
  [/\b(borscht|pelmeni)\b/i, 'UA', 'signature dish name'],
  [/\b(plov|osh)\b/i, 'UZ', 'signature dish name'],
  [/\b(manti)\b/i, 'KG', 'signature dish name'],
  [/\b(ghormeh sabzi|chelow kebab|fesenjan|ash reshteh|abgoosht|dizi)\b/i, 'IR', 'signature dish name'],
  [/\b(dal bhat|momo)\b/i, 'NP', 'signature dish name'],
  [/\b(peri peri|peri-peri chicken)\b/i, 'MZ', 'regional dish lexicon'],
];

const wordEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsWord = (text, value) => new RegExp(`\\b${wordEscape(value)}\\b`, 'i').test(text);

function infer(recipe) {
  const text = norm([recipe.name, recipe.native_name, recipe.description].filter(Boolean).join(' '));
  const allText = norm([recipe.name, recipe.native_name, recipe.description, recipe.cuisine].filter(Boolean).join(' '));
  const name = norm(recipe.name);
  const candidates = new Map();
  const add = (iso2, relationType, confidence, evidence, priority) => {
    if (!iso2) return;
    const key = `${iso2}:${relationType}`;
    const previous = candidates.get(key);
    const candidate = { iso2, relation_type: relationType, confidence, evidence, priority };
    if (!previous || priority > previous.priority || (priority === previous.priority && confidence > previous.confidence)) candidates.set(key, candidate);
  };

  const nameCountryAliases = [...countryNameAliases.entries()].filter(([alias]) => containsWord(name, alias));
  const cuisine = norm(recipe.cuisine);
  const cuisineCountryAliases = [...countryNameAliases.entries()].filter(([alias]) => containsWord(cuisine, alias));
  const variantCountryWords = /\(([^)]*\b(?:greek|italian|french|mexican|american|british|indian|chinese|japanese|korean|thai|vietnamese|turkish|persian|iranian|lebanese|palestinian|moroccan|egyptian|ethiopian|nigerian|brazilian|argentinian|peruvian|colombian|jamaican|cuban)\b[^)]*)\)/i;
  const variantMatch = variantCountryWords.exec(recipe.name || '');
  const explicitVariantCountries = variantMatch ? [...countryNameAliases.entries()].filter(([alias]) => containsWord(norm(variantMatch[1]), alias)) : [];

  for (const [re, iso2, evidence] of strongDishOrigins) {
    if (!re.test(allText)) continue;
    if (explicitVariantCountries.length > 0 && explicitVariantCountries.some(([, explicitIso]) => explicitIso !== iso2)) continue;
    add(iso2, 'origin', 0.96, evidence, 100);
  }

  const inspired = /\binspired\b/i.test(cuisine);
  for (const [, iso2] of cuisineCountryAliases) {
    add(iso2, inspired ? 'associated' : 'traditional', inspired ? 0.78 : 0.90, `recipe.cuisine=${recipe.cuisine}`, inspired ? 80 : 90);
  }

  for (const [alias, iso2] of nameCountryAliases) {
    add(iso2, 'associated', 0.74, `recipe.name country/cultural term: ${alias}`, 65);
  }

  for (const [alias, iso2] of countryNameAliases) {
    if (nameCountryAliases.some(([knownAlias]) => knownAlias === alias)) continue;
    if (containsWord(text, alias)) add(iso2, 'associated', 0.72, `country/cultural term: ${alias}`, 60);
  }

  const originCountries = new Set([...candidates.values()].filter((row) => row.relation_type === 'origin').map((row) => row.iso2));
  const relations = [...candidates.values()]
    .filter((row) => !originCountries.has(row.iso2) || row.relation_type === 'origin')
    .map(({ iso2, relation_type, confidence, evidence }) => ({ iso2, relation_type, confidence, evidence, is_primary: relation_type === 'origin' }));

  relations.sort((a, b) => a.is_primary !== b.is_primary ? (a.is_primary ? -1 : 1) : b.confidence - a.confidence || a.iso2.localeCompare(b.iso2));
  return { relations, global: relations.length === 0, globalConfidence: relations.length === 0 ? 0.62 : null };
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

function inFilter(ids) { return `in.(${ids.join(',')})`; }

async function seedCountries(countries) {
  if (DRY_RUN) return;
  for (const batch of chunk(countries, 500)) {
    const rows = batch.map((country) => ({ iso2: country.iso2, iso3: country.iso3, name: country.name, continent: country.continent, subregion: country.subregion, target_recipes: 100, minimum_recipes: 20, is_active: true }));
    await rest('countries?on_conflict=iso2', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
  }
}

async function removePreviousV2(recipeIds) {
  if (DRY_RUN || recipeIds.length === 0) return;
  for (const idBatch of chunk(recipeIds, 500)) {
    await rest(`recipe_country_relations?recipe_id=${inFilter(idBatch)}&source=eq.${encodeURIComponent(INTELLIGENCE_SOURCE)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  }
}

async function removeLegacyV1(recipeIds) {
  if (DRY_RUN || recipeIds.length === 0) return;
  for (const idBatch of chunk(recipeIds, 500)) {
    await rest(`recipe_country_relations?recipe_id=${inFilter(idBatch)}&source=eq.${encodeURIComponent(V1_SOURCE)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  }
}

async function persist(countryRows, classifications) {
  if (DRY_RUN) return;
  for (const batch of chunk(countryRows, BATCH)) {
    await rest('recipe_country_relations?on_conflict=recipe_id,country_id,relation_type', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(batch) });
  }

  const globalIds = classifications.filter((row) => row.global).map((row) => row.id);
  const nonGlobalIds = classifications.filter((row) => !row.global).map((row) => row.id);
  for (const idBatch of chunk(globalIds, 500)) {
    await rest(`recipes?id=${inFilter(idBatch)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_global: true, global_confidence: 0.62, classification_version: VERSION }) });
  }
  for (const idBatch of chunk(nonGlobalIds, 500)) {
    await rest(`recipes?id=${inFilter(idBatch)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_global: false, global_confidence: null, classification_version: VERSION }) });
  }
}

async function main() {
  const countries = csvParse(await fs.readFile(CSV, 'utf8'));
  if (countries.length !== 195) throw new Error(`Expected 195 countries, found ${countries.length}`);

  let recipes = await allRows('recipes', 'id,name,native_name,description,cuisine,classification_version,is_global,global_confidence', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const recipeIds = recipes.map((recipe) => recipe.id);

  await seedCountries(countries);
  const dbCountries = await allRows('countries', 'id,iso2,iso3,name', 'iso2.asc');
  const byIso = new Map(dbCountries.map((country) => [country.iso2, country.id]));

  const countryRows = [];
  const classifications = [];
  const relationCounts = { origin: 0, traditional: 0, associated: 0, popular: 0 };
  const audit = [];

  for (const recipe of recipes) {
    const result = infer(recipe);
    classifications.push({ id: recipe.id, global: result.global });
    const resolvedRelations = [];
    for (const relation of result.relations) {
      const countryId = byIso.get(relation.iso2);
      if (!countryId) continue;
      countryRows.push({ recipe_id: recipe.id, country_id: countryId, relation_type: relation.relation_type, confidence: relation.confidence, source: INTELLIGENCE_SOURCE, source_ref: SOURCE_REF, evidence: relation.evidence, is_primary: relation.is_primary });
      relationCounts[relation.relation_type] += 1;
      resolvedRelations.push({ country: relation.iso2, type: relation.relation_type, confidence: relation.confidence, evidence: relation.evidence });
    }
    if (AUDIT) audit.push({ id: recipe.id, name: recipe.name, cuisine: recipe.cuisine, global: result.global, globalConfidence: result.globalConfidence, relations: resolvedRelations });
  }

  if (!DRY_RUN) {
    await removePreviousV2(recipeIds);
    await persist(countryRows, classifications);
    await removeLegacyV1(recipeIds);
  }

  console.log(JSON.stringify({ status: 'complete', mode: DRY_RUN ? 'dry-run' : 'apply', countriesSeeded: DRY_RUN ? 0 : countries.length, recipesProcessed: recipes.length, countryRelations: countryRows.length, relationCounts, globalRecipes: classifications.filter((row) => row.global).length, version: VERSION, ...(AUDIT ? { audit } : {}) }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
