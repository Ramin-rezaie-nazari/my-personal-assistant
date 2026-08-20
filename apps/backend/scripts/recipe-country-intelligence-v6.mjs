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
const VERSION = 'country-rules-v6';
const SOURCES_TO_REPLACE = ['country-rules-v1', 'country-intelligence'];
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
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase credentials are required for database access.');
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
  return lines.slice(1).map((line) => {
    const [iso2, iso3, name, continent, subregion] = line.split(',');
    return { iso2, iso3, name, continent, subregion };
  }).filter((row) => row.iso2 && row.iso3 && row.name);
}

const aliases = new Map([
  ['american', 'US'], ['america', 'US'], ['united states', 'US'], ['usa', 'US'],
  ['british', 'GB'], ['britain', 'GB'], ['england', 'GB'], ['uk', 'GB'],
  ['french', 'FR'], ['france', 'FR'], ['italian', 'IT'], ['italy', 'IT'],
  ['spanish', 'ES'], ['spain', 'ES'], ['portuguese', 'PT'], ['portugal', 'PT'],
  ['german', 'DE'], ['germany', 'DE'], ['austrian', 'AT'], ['austria', 'AT'],
  ['polish', 'PL'], ['poland', 'PL'], ['hungarian', 'HU'], ['hungary', 'HU'],
  ['greek', 'GR'], ['greece', 'GR'], ['turkish', 'TR'], ['turkey', 'TR'],
  ['lebanese', 'LB'], ['lebanon', 'LB'], ['palestinian', 'PS'], ['palestine', 'PS'],
  ['moroccan', 'MA'], ['morocco', 'MA'], ['egyptian', 'EG'], ['egypt', 'EG'],
  ['persian', 'IR'], ['iranian', 'IR'], ['iran', 'IR'],
  ['indian', 'IN'], ['india', 'IN'], ['nepalese', 'NP'], ['nepal', 'NP'],
  ['chinese', 'CN'], ['china', 'CN'], ['japanese', 'JP'], ['japan', 'JP'],
  ['korean', 'KR'], ['korea', 'KR'], ['thai', 'TH'], ['thailand', 'TH'],
  ['vietnamese', 'VN'], ['vietnam', 'VN'], ['indonesian', 'ID'], ['indonesia', 'ID'],
  ['malaysian', 'MY'], ['malaysia', 'MY'], ['filipino', 'PH'], ['philippines', 'PH'],
  ['singaporean', 'SG'], ['singapore', 'SG'], ['canadian', 'CA'], ['canada', 'CA'],
  ['brazilian', 'BR'], ['brazil', 'BR'], ['argentinian', 'AR'], ['argentina', 'AR'],
  ['peruvian', 'PE'], ['peru', 'PE'], ['colombian', 'CO'], ['colombia', 'CO'],
  ['cuban', 'CU'], ['cuba', 'CU'], ['jamaican', 'JM'], ['jamaica', 'JM'],
  ['nigerian', 'NG'], ['nigeria', 'NG'], ['ethiopian', 'ET'], ['ethiopia', 'ET'],
  ['south african', 'ZA'], ['south africa', 'ZA'], ['ukrainian', 'UA'], ['ukraine', 'UA'],
]);

// Conservative named-dish attribution. Ambiguous terms are intentionally excluded.
const dishOrigins = [
  [/\b(cao lau|banh mi|pho|bun cha|bun bo hue|goi cuon)\b/i, 'VN'],
  [/\b(sushi|sashimi|ramen|tempura|okonomiyaki|miso soup|yakitori|onigiri|udon|soba|mochi)\b/i, 'JP'],
  [/\b(kimchi|bibimbap|bulgogi|tteokbokki|kimbap|japchae)\b/i, 'KR'],
  [/\b(pad thai|tom yum|tom kha|green curry|massaman curry|som tam|larb)\b/i, 'TH'],
  [/\b(nasi goreng|rendang|gado gado|gado-gado|sate ayam|satay|soto ayam)\b/i, 'ID'],
  [/\b(nasi lemak|laksa|char kway teow|roti canai)\b/i, 'MY'],
  [/\b(adobo|sinigang|pancit|lechon)\b/i, 'PH'],
  [/\b(hainanese chicken rice|chilli crab)\b/i, 'SG'],
  [/\b(injera|doro wat|doro wot|tibs|kitfo)\b/i, 'ET'],
  [/\b(jollof rice|egusi soup|suya|pounded yam)\b/i, 'NG'],
  [/\b(couscous|tagine|tajine|harira|pastilla|bastilla|charmoula|chermoula)\b/i, 'MA'],
  [/\b(koshari|molokhia|ful medames|foul medames|basbousa)\b/i, 'EG'],
  [/\b(ghormeh sabzi|chelow kebab|fesenjan|ash reshteh|abgoosht|dizi|zereshk polo|baghali polo|kuku sabzi)\b/i, 'IR'],
  [/\b(moussaka|spanakopita|pastitsio|saganaki|tzatziki|avgolemono)\b/i, 'GR'],
  [/\b(tabouleh|tabbouleh|kibbeh|kibbe|fattoush|manakish|sfouf)\b/i, 'LB'],
  [/\b(mujaddara|mejadra|maqluba|maklouba|mansaf|musabaha)\b/i, 'PS'],
  [/\b(biryani|dosa|idli|samosa|palak paneer|butter chicken|tandoori chicken|chana masala|aloo gobi|vindaloo|rogan josh|dal makhani|rajma|paratha)\b/i, 'IN'],
  [/\b(dal bhat|momo)\b/i, 'NP'],
  [/\b(feijoada|brigadeiro|pao de queijo|moqueca)\b/i, 'BR'],
  [/\b(ceviche|lomo saltado|aji de gallina|anticuchos)\b/i, 'PE'],
  [/\b(asado|empanadas? argentinas|choripan|milanesa)\b/i, 'AR'],
  [/\b(arepa|ajiaco|bandeja paisa|sancocho)\b/i, 'CO'],
  [/\b(ropa vieja|moros y cristianos|mojo pork)\b/i, 'CU'],
  [/\b(jamaican jerk|jerk chicken|ackee and saltfish)\b/i, 'JM'],
  [/\b(poutine|tourtiere|montreal smoked meat)\b/i, 'CA'],
  [/\b(paella|gazpacho|tortilla espanola|tortilla de patatas|churros|patatas bravas|croquetas|pisto|gambas al ajillo)\b/i, 'ES'],
  [/\b(bacalhau|caldo verde|pastel de nata|francesinha|cataplana)\b/i, 'PT'],
  [/\b(sauerbraten|bratwurst|kartoffelpuffer|pretzel|rouladen|currywurst)\b/i, 'DE'],
  [/\b(sachertorte|wiener schnitzel|kaiserschmarrn)\b/i, 'AT'],
  [/\b(goulash|paprikash|dobos torte)\b/i, 'HU'],
  [/\b(pierogi|paczki|barszcz)\b/i, 'PL'],
  [/\b(fish and chips|shepherds? pie|beef wellington|sticky toffee pudding|yorkshire pudding|toad in the hole|eton mess)\b/i, 'GB'],
  [/\b(boxty|colcannon|irish stew|soda bread|barmbrack)\b/i, 'IE'],
  [/\b(neapolitan pizza|margherita pizza|pizza napoletana|carbonara|cacio e pepe|ossobuco|osso buco|risotto alla milanese|tiramisu|saltimbocca|panzanella|bresaola|arancini|parmigiana|vitello tonnato|bistecca alla fiorentina)\b/i, 'IT'],
  [/\b(coq au vin|ratatouille|bouillabaisse|quiche lorraine|creme brulee|beef bourguignon|tarte tatin|clafoutis|pot-au-feu)\b/i, 'FR'],
  [/\b(mole poblano|tacos al pastor|chiles en nogada|pozole|cochinita pibil)\b/i, 'MX'],
  [/\b(gumbo|jambalaya|shrimp creole)\b/i, 'US'],
];

const dishAssociations = [
  [/\b(mole)\b/i, 'MX', 0.86, 'named Mexican sauce family'],
  [/\b(sauerkraut)\b/i, 'DE', 0.84, 'Germanic food family'],
  [/\b(aioli)\b/i, 'FR', 0.70, 'French/Mediterranean sauce family'],
  [/\b(charmoula|chermoula)\b/i, 'MA', 0.88, 'Maghrebi condiment family'],
  [/\b(french canadian)\b/i, 'CA', 0.92, 'compound cultural term'],
  [/\b(saltimbocca)\b/i, 'IT', 0.90, 'Italian dish family'],
  [/\b(panzanella)\b/i, 'IT', 0.90, 'Italian dish family'],
  [/\b(bresaola)\b/i, 'IT', 0.90, 'Italian cured-meat family'],
];

const regionalRules = [
  [/\b(mediterranean|levantine|middle eastern|middle east|maghreb|maghrebi)\b/i, 'regional_not_country_specific'],
  [/\b(south asian|southeast asian|central asian|caribbean|african|north african|latin american)\b/i, 'regional_not_country_specific'],
  [/\b(creole|cajun)\b/i, 'regional_or_cultural'],
];

const globalHigh = [
  /\bpizza\b/i, /\bpasta\b/i, /\bburger(s)?\b/i, /\bhamburger(s)?\b/i,
  /\bfried rice\b/i, /\bnoodle(s)?\b/i, /\bsushi\b/i, /\bramen\b/i,
  /\btaco(s)?\b/i, /\bcurry\b/i, /\bsandwich(es)?\b/i, /\bice cream\b/i,
  /\bcheesecake\b/i, /\bpancake(s)?\b/i, /\bwaffle(s)?\b/i,
  /\bhot dog(s)?\b/i, /\bfrench fries\b/i, /\bchocolate cake\b/i,
  /\bchocolate chip cookie(s)?\b/i, /\bmochi\b/i, /\bdumplings?\b/i,
];
const globalMedium = [
  /\bshawarma\b/i, /\bfalafel\b/i, /\bhummus\b/i, /\bteriyaki\b/i,
  /\bpad thai\b/i, /\bpho\b/i, /\bbiryani\b/i, /\bempanadas?\b/i,
  /\bcrepes?\b/i, /\bsmoothie(s)?\b/i, /\bmuffin(s)?\b/i,
  /\bdoughnut(s)?\b/i, /\bdonut(s)?\b/i, /\bfried chicken\b/i,
];
const excludedGlobal = [
  /\bglobal house salad\b/i, /\bworld peace cookies?\b/i, /\bout of this world\b/i,
  /\bworld of\b/i, /\bbest of both worlds\b/i,
];

const relationPriority = { origin: 4, traditional: 3, associated: 2, popular: 1 };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (text, value) => new RegExp(`\\b${escapeRegex(value)}\\b`, 'i').test(text);

function inferGlobal(recipe, name, text) {
  if (excludedGlobal.some((rule) => rule.test(name))) return { global: false, confidence: null, evidence: null };
  if (globalHigh.some((rule) => rule.test(name))) return { global: true, confidence: 0.92, evidence: 'globally recognized dish family' };
  if (globalMedium.some((rule) => rule.test(name))) return { global: true, confidence: 0.82, evidence: 'widely internationalized dish family' };
  if (/\b(international|world cuisine|worldwide)\b/i.test(norm(recipe.cuisine))) return { global: true, confidence: 0.84, evidence: 'explicit global cuisine label' };
  if (recipe.cuisine && globalHigh.some((rule) => rule.test(norm([name, text].join(' '))))) return { global: true, confidence: 0.88, evidence: 'global family supported by metadata' };
  return { global: false, confidence: null, evidence: null };
}

function infer(recipe) {
  const name = norm(recipe.name);
  const cuisine = norm(recipe.cuisine);
  const text = norm([recipe.name, recipe.native_name, recipe.description].filter(Boolean).join(' '));
  const allText = norm([recipe.name, recipe.native_name, recipe.description, recipe.cuisine].filter(Boolean).join(' '));
  const candidates = new Map();
  const add = (iso2, type, confidence, evidence, priority = relationPriority[type]) => {
    const key = `${iso2}:${type}`;
    const previous = candidates.get(key);
    const current = { iso2, relation_type: type, confidence, evidence, priority };
    if (!previous || priority > previous.priority || (priority === previous.priority && confidence > previous.confidence)) candidates.set(key, current);
  };

  const variant = /\(([^)]*)\)/.exec(recipe.name || '');
  const variantText = variant ? norm(variant[1]) : '';
  const variantCountries = [...aliases.entries()].filter(([alias]) => hasWord(variantText, alias));

  for (const [rule, iso2] of dishOrigins) {
    if (!rule.test(allText)) continue;
    if (variantCountries.length && variantCountries.some(([, v]) => v !== iso2)) continue;
    add(iso2, 'origin', 0.96, 'strong named-dish origin lexicon', 100);
  }

  for (const [rule, iso2, confidence, evidence] of dishAssociations) {
    if (rule.test(name)) add(iso2, 'associated', confidence, evidence, 82);
  }

  const cuisineAliases = [...aliases.entries()].filter(([alias]) => hasWord(cuisine, alias));
  const inspired = /\binspired\b/i.test(cuisine);
  for (const [, iso2] of cuisineAliases) {
    add(iso2, inspired ? 'associated' : 'traditional', inspired ? 0.78 : 0.90, `recipe.cuisine=${recipe.cuisine}`, inspired ? 80 : 90);
  }

  if (/\bfrench canadian\b/i.test(name)) add('CA', 'associated', 0.92, 'compound cultural term', 95);

  // Name country words are association-level evidence. Avoid letting "Greek" override explicit Levantine evidence for hummus-like dishes.
  const hasLevantineContext = /\b(levantine|levant|middle eastern|middle east)\b/i.test(allText);
  for (const [alias, iso2] of aliases) {
    if (alias === 'french' && /\bfrench canadian\b/i.test(name)) continue;
    if (hasLevantineContext && iso2 === 'GR' && /\b(hummus|falafel|shakshuka)\b/i.test(name)) continue;
    if (hasWord(name, alias)) add(iso2, 'associated', 0.74, `recipe.name cultural term: ${alias}`, 65);
  }

  const originCountries = new Set([...candidates.values()].filter((row) => row.relation_type === 'origin').map((row) => row.iso2));
  const bestByCountry = new Map();
  for (const candidate of candidates.values()) {
    if (originCountries.has(candidate.iso2) && candidate.relation_type !== 'origin') continue;
    const previous = bestByCountry.get(candidate.iso2);
    if (!previous || relationPriority[candidate.relation_type] > relationPriority[previous.relation_type] || (relationPriority[candidate.relation_type] === relationPriority[previous.relation_type] && candidate.confidence > previous.confidence)) {
      bestByCountry.set(candidate.iso2, candidate);
    }
  }

  const relations = [...bestByCountry.values()].map(({ iso2, relation_type, confidence, evidence }) => ({
    iso2,
    relation_type,
    confidence,
    evidence,
    is_primary: relation_type === 'origin',
  })).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || b.confidence - a.confidence || a.iso2.localeCompare(b.iso2));

  const global = inferGlobal(recipe, name, text);
  const regional = regionalRules.find(([rule]) => rule.test(allText));
  let unknownReason = null;
  if (!global.global && relations.length === 0) {
    if (regional) unknownReason = regional[1];
    else if (!recipe.cuisine && !recipe.native_name && /pending ingredient normalization/i.test(recipe.description || '')) unknownReason = 'source_metadata_only';
    else if (!recipe.cuisine && !recipe.native_name) unknownReason = 'insufficient_metadata';
    else unknownReason = 'insufficient_cultural_evidence';
  }

  return {
    relations,
    global: global.global,
    globalConfidence: global.confidence,
    globalEvidence: global.evidence,
    unknown: !global.global && relations.length === 0,
    unknownReason,
  };
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
    await rest('countries?on_conflict=iso2', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch.map((c) => ({ ...c, target_recipes: 100, minimum_recipes: 20, is_active: true }))),
    });
  }
}

async function removeSource(recipeIds, source) {
  if (DRY_RUN || !recipeIds.length) return;
  for (const batch of chunk(recipeIds, 500)) {
    await rest(`recipe_country_relations?recipe_id=${inFilter(batch)}&source=eq.${encodeURIComponent(source)}`, {
      method: 'DELETE', headers: { Prefer: 'return=minimal' },
    });
  }
}

async function persist(countryRows, classifications) {
  if (DRY_RUN) return;
  for (const batch of chunk(countryRows, BATCH)) {
    await rest('recipe_country_relations?on_conflict=recipe_id,country_id,relation_type', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(batch),
    });
  }
  for (const batch of chunk(classifications, 500)) {
    for (const row of batch) {
      await rest(`recipes?id=eq.${row.id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ is_global: row.global, global_confidence: row.globalConfidence, classification_version: VERSION }),
      });
    }
  }
}

async function main() {
  const countries = csvParse(await fs.readFile(CSV, 'utf8'));
  if (countries.length !== 195) throw new Error(`Expected 195 countries, found ${countries.length}`);
  let recipes = await allRows('recipes', 'id,name,native_name,description,cuisine', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const recipeIds = recipes.map((r) => r.id);
  if (!DRY_RUN) await seedCountries(countries);
  const dbCountries = await allRows('countries', 'id,iso2,iso3,name', 'iso2.asc');
  const countryByIso = new Map(dbCountries.map((c) => [c.iso2, c.id]));

  const countryRows = [];
  const classifications = [];
  const relationCounts = { origin: 0, traditional: 0, associated: 0, popular: 0 };
  const unknownReasons = {};
  const audit = [];

  for (const recipe of recipes) {
    const result = infer(recipe);
    const classification = { id: recipe.id, global: result.global, globalConfidence: result.globalConfidence, relationCount: result.relations.length };
    classifications.push(classification);
    const resolved = [];
    for (const relation of result.relations) {
      const countryId = countryByIso.get(relation.iso2);
      if (!countryId) continue;
      countryRows.push({ recipe_id: recipe.id, country_id: countryId, relation_type: relation.relation_type, confidence: relation.confidence, source: SOURCE, source_ref: SOURCE_REF, evidence: relation.evidence, is_primary: relation.is_primary });
      relationCounts[relation.relation_type] += 1;
      resolved.push({ country: relation.iso2, type: relation.relation_type, confidence: relation.confidence, evidence: relation.evidence });
    }
    if (result.unknownReason) unknownReasons[result.unknownReason] = (unknownReasons[result.unknownReason] || 0) + 1;
    if (AUDIT) audit.push({ id: recipe.id, name: recipe.name, cuisine: recipe.cuisine, global: result.global, globalConfidence: result.globalConfidence, globalEvidence: result.globalEvidence, unknown: result.unknown, unknownReason: result.unknownReason, relations: resolved });
  }

  if (!DRY_RUN) {
    for (const source of SOURCES_TO_REPLACE) await removeSource(recipeIds, source);
    await persist(countryRows, classifications);
  }

  console.log(JSON.stringify({
    status: 'complete', mode: DRY_RUN ? 'dry-run' : 'apply', countriesSeeded: DRY_RUN ? 0 : countries.length,
    recipesProcessed: recipes.length, countryRelations: countryRows.length, relationCounts,
    globalRecipes: classifications.filter((r) => r.global).length,
    unknownRecipes: classifications.filter((r) => !r.global && r.relationCount === 0).length,
    unknownReasons, version: VERSION, ...(AUDIT ? { audit } : {}),
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
