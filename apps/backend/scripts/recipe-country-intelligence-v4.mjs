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
const VERSION = 'country-rules-v4';
const LEGACY_SOURCE = 'country-rules-v1';
const SOURCE = 'country-intelligence';
const SOURCE_REF = VERSION;

if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when applying changes.');
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(pathname, options = {}, attempts = 6) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase credentials are required for database access.');
  }

  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) },
      });
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

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvParse(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let index = 1; index < lines.length; index += 1) {
    const [iso2, iso3, name, continent, subregion] = lines[index].split(',');
    if (iso2 && iso3 && name) rows.push({ iso2, iso3, name, continent, subregion });
  }
  return rows;
}

const countryAliases = new Map([
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
  ['canadian', 'CA'], ['canada', 'CA'], ['australian', 'AU'], ['australia', 'AU'],
  ['irish', 'IE'], ['ireland', 'IE'], ['russian', 'RU'], ['russia', 'RU'],
  ['ukrainian', 'UA'], ['ukraine', 'UA'], ['polish', 'PL'], ['poland', 'PL'],
  ['hungarian', 'HU'], ['hungary', 'HU'], ['greek', 'GR'], ['indonesian', 'ID'], ['indonesia', 'ID'],
  ['malaysian', 'MY'], ['malaysia', 'MY'], ['filipino', 'PH'], ['philippines', 'PH'],
  ['singaporean', 'SG'], ['singapore', 'SG'], ['nepalese', 'NP'], ['nepal', 'NP'],
]);

const originRules = [
  [/\b(neapolitan pizza|margherita pizza|pizza napoletana|carbonara|cacio e pepe|ossobuco|risotto alla milanese|tiramisu)\b/i, 'IT'],
  [/\b(paella|gazpacho|tortilla espanola|churros)\b/i, 'ES'],
  [/\b(coq au vin|ratatouille|bouillabaisse|quiche lorraine|creme brulee)\b/i, 'FR'],
  [/\b(sushi|sashimi|ramen|tempura|okonomiyaki|miso soup)\b/i, 'JP'],
  [/\b(kimchi|bibimbap|bulgogi|tteokbokki)\b/i, 'KR'],
  [/\b(pad thai|tom yum|tom kha|green curry|massaman curry)\b/i, 'TH'],
  [/\b(pho|banh mi|bun cha|goi cuon|bun bo hue)\b/i, 'VN'],
  [/\b(tacos al pastor|mole poblano|chiles en nogada|pozole)\b/i, 'MX'],
  [/\b(biryani|dosa|idli|samosa|palak paneer|butter chicken|tandoori chicken)\b/i, 'IN'],
  [/\b(hummus|falafel|shakshuka)\b/i, 'PS'],
  [/\b(tabouleh|tabbouleh|kibbeh)\b/i, 'LB'],
  [/\b(couscous|tagine|tajine)\b/i, 'MA'],
  [/\b(jollof rice)\b/i, 'NG'],
  [/\b(injera|doro wat|doro wot)\b/i, 'ET'],
  [/\b(feijoada|brigadeiro|pao de queijo)\b/i, 'BR'],
  [/\b(ceviche|lomo saltado|aji de gallina)\b/i, 'PE'],
  [/\b(asado|empanadas? argentinas)\b/i, 'AR'],
  [/\b(goulash)\b/i, 'HU'],
  [/\b(moussaka|spanakopita)\b/i, 'GR'],
  [/\b(kebab|doner|doner kebab|lahmacun|baklava)\b/i, 'TR'],
  [/\b(sauerbraten|bratwurst|pretzel|kartoffelpuffer)\b/i, 'DE'],
  [/\b(fish and chips|shepherds? pie|beef wellington|sticky toffee pudding)\b/i, 'GB'],
  [/\b(poutine|tourtiere)\b/i, 'CA'],
  [/\b(hainanese chicken rice)\b/i, 'SG'],
  [/\b(nasi goreng|rendang|gado gado|gado-gado|satay|sate ayam)\b/i, 'ID'],
  [/\b(nasi lemak|laksa|char kway teow)\b/i, 'MY'],
  [/\b(adobo|sinigang|pancit)\b/i, 'PH'],
  [/\b(borscht|pelmeni)\b/i, 'UA'],
  [/\b(plov|osh)\b/i, 'UZ'],
  [/\b(manti)\b/i, 'KG'],
  [/\b(ghormeh sabzi|chelow kebab|fesenjan|ash reshteh|abgoosht|dizi)\b/i, 'IR'],
  [/\b(dal bhat|momo)\b/i, 'NP'],
  [/\b(peri peri|peri-peri chicken)\b/i, 'MZ'],
];

const globalHighConfidence = [
  /\bpizza\b/i, /\bpasta\b/i, /\bburger(s)?\b/i, /\bhamburger(s)?\b/i,
  /\bfried rice\b/i, /\bnoodle(s)?\b/i, /\bsushi\b/i, /\bramen\b/i,
  /\btaco(s)?\b/i, /\bcurry\b/i, /\bsandwich(es)?\b/i, /\bice cream\b/i,
  /\bicecream\b/i, /\bcheesecake\b/i, /\bpancake(s)?\b/i, /\bwaffle(s)?\b/i,
  /\bhot dog(s)?\b/i, /\bfrench fries\b/i, /\bchocolate cake\b/i,
  /\bchocolate chip cookie(s)?\b/i, /\bcookies?\b/i,
];

const globalMediumConfidence = [
  /\bshawarma\b/i, /\bfalafel\b/i, /\bhummus\b/i, /\bchicken tikka masala\b/i,
  /\bteriyaki\b/i, /\bpad thai\b/i, /\bpho\b/i, /\bbiryani\b/i,
  /\bdumplings?\b/i, /\bempanadas?\b/i, /\bcrepes?\b/i, /\bsmoothie(s)?\b/i,
  /\bmuffin(s)?\b/i, /\bdoughnut(s)?\b/i, /\bdonut(s)?\b/i,
];

const excludedGlobalWords = [
  /\bglobal house salad\b/i,
  /\bworld peace cookies?\b/i,
  /\bout of this world\b/i,
  /\bworld of\b/i,
  /\bbest of both worlds\b/i,
];

const relationPriority = { origin: 4, traditional: 3, associated: 2, popular: 1 };

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (text, value) => new RegExp(`\\b${escapeRegex(value)}\\b`, 'i').test(text);

function inferGlobal(name, cuisine, text) {
  const searchable = norm([name, cuisine, text].filter(Boolean).join(' '));
  if (excludedGlobalWords.some((rule) => rule.test(name))) {
    return { global: false, confidence: null, evidence: null };
  }

  if (globalHighConfidence.some((rule) => rule.test(searchable))) {
    return { global: true, confidence: 0.88, evidence: 'globally recognized dish family' };
  }

  if (globalMediumConfidence.some((rule) => rule.test(searchable))) {
    return { global: true, confidence: 0.80, evidence: 'widely internationalized dish family' };
  }

  if (/\b(international|world cuisine|worldwide)\b/i.test(cuisine)) {
    return { global: true, confidence: 0.84, evidence: `explicit global cuisine label: ${cuisine}` };
  }

  return { global: false, confidence: null, evidence: null };
}

function infer(recipe) {
  const text = norm([recipe.name, recipe.native_name, recipe.description].filter(Boolean).join(' '));
  const allText = norm([recipe.name, recipe.native_name, recipe.description, recipe.cuisine].filter(Boolean).join(' '));
  const name = norm(recipe.name);
  const cuisine = norm(recipe.cuisine);
  const candidates = new Map();

  const add = (iso2, relationType, confidence, evidence, priority) => {
    if (!iso2) return;
    const key = `${iso2}:${relationType}`;
    const candidate = { iso2, relation_type: relationType, confidence, evidence, priority };
    const previous = candidates.get(key);
    if (!previous || priority > previous.priority || (priority === previous.priority && confidence > previous.confidence)) {
      candidates.set(key, candidate);
    }
  };

  const variantMatch = /\(([^)]*)\)/.exec(recipe.name || '');
  const variantText = variantMatch ? norm(variantMatch[1]) : '';
  const explicitVariantCountries = [...countryAliases.entries()].filter(([alias]) => hasWord(variantText, alias));

  for (const [rule, iso2] of originRules) {
    if (!rule.test(allText)) continue;
    if (explicitVariantCountries.length > 0 && explicitVariantCountries.some(([, explicitIso]) => explicitIso !== iso2)) {
      continue;
    }
    add(iso2, 'origin', 0.96, 'strong dish-origin lexicon', 100);
  }

  const cuisineAliases = [...countryAliases.entries()].filter(([alias]) => hasWord(cuisine, alias));
  const inspired = /\binspired\b/i.test(cuisine);
  for (const [alias, iso2] of cuisineAliases) {
    add(
      iso2,
      inspired ? 'associated' : 'traditional',
      inspired ? 0.78 : 0.90,
      `recipe.cuisine=${recipe.cuisine}`,
      inspired ? 80 : 90,
    );
  }

  if (/\bfrench canadian\b/i.test(name)) {
    add('CA', 'associated', 0.88, 'compound cultural term: french canadian', 75);
  }

  const nameAliases = [...countryAliases.entries()].filter(([alias]) => hasWord(name, alias));
  for (const [alias, iso2] of nameAliases) {
    if (alias === 'french' && /\bfrench canadian\b/i.test(name)) continue;
    add(iso2, 'associated', 0.74, `recipe.name country/cultural term: ${alias}`, 65);
  }

  for (const [alias, iso2] of countryAliases) {
    if (nameAliases.some(([knownAlias]) => knownAlias === alias)) continue;
    if (/\bfrench canadian\b/i.test(name) && alias === 'french') continue;
    if (hasWord(text, alias)) add(iso2, 'associated', 0.72, `country/cultural term: ${alias}`, 60);
  }

  const originCountries = new Set(
    [...candidates.values()]
      .filter((row) => row.relation_type === 'origin')
      .map((row) => row.iso2),
  );

  const bestByCountry = new Map();
  for (const candidate of candidates.values()) {
    if (originCountries.has(candidate.iso2) && candidate.relation_type !== 'origin') continue;
    const previous = bestByCountry.get(candidate.iso2);
    if (
      !previous ||
      relationPriority[candidate.relation_type] > relationPriority[previous.relation_type] ||
      (
        relationPriority[candidate.relation_type] === relationPriority[previous.relation_type] &&
        candidate.confidence > previous.confidence
      )
    ) {
      bestByCountry.set(candidate.iso2, candidate);
    }
  }

  const relations = [...bestByCountry.values()]
    .map(({ iso2, relation_type, confidence, evidence }) => ({
      iso2,
      relation_type,
      confidence,
      evidence,
      is_primary: relation_type === 'origin',
    }))
    .sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        b.confidence - a.confidence ||
        a.iso2.localeCompare(b.iso2),
    );

  const global = inferGlobal(recipe.name, recipe.cuisine, text);

  return {
    relations,
    global: global.global,
    globalConfidence: global.confidence,
    globalEvidence: global.evidence,
  };
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

function inFilter(ids) {
  return `in.(${ids.join(',')})`;
}

async function seedCountries(countries) {
  if (DRY_RUN) return;
  for (const batch of chunk(countries, 500)) {
    const rows = batch.map((country) => ({
      iso2: country.iso2,
      iso3: country.iso3,
      name: country.name,
      continent: country.continent,
      subregion: country.subregion,
      target_recipes: 100,
      minimum_recipes: 20,
      is_active: true,
    }));
    await rest('countries?on_conflict=iso2', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows),
    });
  }
}

async function removeSource(recipeIds, source) {
  if (DRY_RUN || recipeIds.length === 0) return;
  for (const batch of chunk(recipeIds, 500)) {
    await rest(
      `recipe_country_relations?recipe_id=${inFilter(batch)}&source=eq.${encodeURIComponent(source)}`,
      { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
    );
  }
}

async function persist(countryRows, classifications) {
  if (DRY_RUN) return;

  for (const batch of chunk(countryRows, BATCH)) {
    await rest('recipe_country_relations?on_conflict=recipe_id,country_id,relation_type', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch),
    });
  }

  const globalIds = classifications.filter((row) => row.global).map((row) => row.id);
  const nonGlobalIds = classifications.filter((row) => !row.global).map((row) => row.id);

  for (const batch of chunk(globalIds, 500)) {
    await rest(`recipes?id=${inFilter(batch)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ is_global: true, global_confidence: Math.max(...classifications.filter((row) => batch.includes(row.id)).map((row) => row.globalConfidence || 0.8), 0.8), classification_version: VERSION }),
    });
  }

  for (const batch of chunk(nonGlobalIds, 500)) {
    await rest(`recipes?id=${inFilter(batch)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ is_global: false, global_confidence: null, classification_version: VERSION }),
    });
  }
}

async function main() {
  const countries = csvParse(await fs.readFile(CSV, 'utf8'));
  if (countries.length !== 195) throw new Error(`Expected 195 countries, found ${countries.length}`);

  let recipes = await allRows(
    'recipes',
    'id,name,native_name,description,cuisine,classification_version,is_global,global_confidence',
    'created_at.asc',
  );
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);

  const recipeIds = recipes.map((recipe) => recipe.id);
  if (!DRY_RUN) await seedCountries(countries);

  const dbCountries = await allRows('countries', 'id,iso2,iso3,name', 'iso2.asc');
  const countryByIso = new Map(dbCountries.map((country) => [country.iso2, country.id]));

  const countryRows = [];
  const classifications = [];
  const relationCounts = { origin: 0, traditional: 0, associated: 0, popular: 0 };
  const audit = [];

  for (const recipe of recipes) {
    const result = infer(recipe);
    classifications.push({
      id: recipe.id,
      global: result.global,
      globalConfidence: result.globalConfidence,
    });

    const resolvedRelations = [];
    for (const relation of result.relations) {
      const countryId = countryByIso.get(relation.iso2);
      if (!countryId) continue;
      countryRows.push({
        recipe_id: recipe.id,
        country_id: countryId,
        relation_type: relation.relation_type,
        confidence: relation.confidence,
        source: SOURCE,
        source_ref: SOURCE_REF,
        evidence: relation.evidence,
        is_primary: relation.is_primary,
      });
      relationCounts[relation.relation_type] += 1;
      resolvedRelations.push({
        country: relation.iso2,
        type: relation.relation_type,
        confidence: relation.confidence,
        evidence: relation.evidence,
      });
    }

    if (AUDIT) {
      audit.push({
        id: recipe.id,
        name: recipe.name,
        cuisine: recipe.cuisine,
        global: result.global,
        globalConfidence: result.globalConfidence,
        globalEvidence: result.globalEvidence,
        relations: resolvedRelations,
      });
    }
  }

  if (!DRY_RUN) {
    await removeSource(recipeIds, SOURCE);
    await persist(countryRows, classifications);
    await removeSource(recipeIds, LEGACY_SOURCE);
  }

  console.log(JSON.stringify({
    status: 'complete',
    mode: DRY_RUN ? 'dry-run' : 'apply',
    countriesSeeded: DRY_RUN ? 0 : countries.length,
    recipesProcessed: recipes.length,
    countryRelations: countryRows.length,
    relationCounts,
    globalRecipes: classifications.filter((row) => row.global).length,
    unknownRecipes: classifications.filter((row) => !row.global && row.relationCount === 0).length,
    version: VERSION,
    ...(AUDIT ? { audit } : {}),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
