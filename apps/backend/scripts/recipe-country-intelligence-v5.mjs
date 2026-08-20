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
const VERSION = 'country-rules-v5';
const LEGACY_SOURCES = ['country-rules-v1', 'country-intelligence'];
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
  ['hungarian', 'HU'], ['hungary', 'HU'], ['indonesian', 'ID'], ['indonesia', 'ID'],
  ['malaysian', 'MY'], ['malaysia', 'MY'], ['filipino', 'PH'], ['philippines', 'PH'],
  ['singaporean', 'SG'], ['singapore', 'SG'], ['nepalese', 'NP'], ['nepal', 'NP'],
]);

// High-signal named dishes or ingredients with a strong cultural signature.
// These are deliberately conservative: generic ingredients never create a country by themselves.
const originRules = [
  // Italy
  [/\b(neapolitan pizza|margherita pizza|pizza napoletana|carbonara|cacio e pepe|ossobuco|osso buco|risotto alla milanese|tiramisu|saltimbocca|saltimbocca alla romana|panzanella|bresaola|arancini|parmigiana|vitello tonnato|cioppino|bistecca alla fiorentina)\b/i, 'IT'],
  // France
  [/\b(coq au vin|ratatouille|bouillabaisse|quiche lorraine|creme brulee|creme caramel|grand aioli|aioli|cassoulet|nicoise|croque monsieur|croque madame|beef bourguignon|tarte tatin|clafoutis|pot-au-feu)\b/i, 'FR'],
  // Spain
  [/\b(paella|gazpacho|tortilla espanola|tortilla de patatas|churros|patatas bravas|croquetas|pisto|fabada|gambas al ajillo)\b/i, 'ES'],
  // Portugal
  [/\b(bacalhau|caldo verde|pastel de nata|francesinha|cataplana)\b/i, 'PT'],
  // UK / Ireland
  [/\b(fish and chips|shepherds? pie|beef wellington|sticky toffee pudding|yorkshire pudding|toad in the hole|eton mess|bread and butter pudding)\b/i, 'GB'],
  [/\b(boxty|colcannon|irish stew|soda bread|barmbrack)\b/i, 'IE'],
  // Germany / Austria / Central Europe
  [/\b(sauerbraten|bratwurst|kartoffelpuffer|pretzel|schnitzel|spatzle|spaetzle|rouladen|currywurst)\b/i, 'DE'],
  [/\b(sachertorte|wiener schnitzel|kaiserschmarrn|strudel)\b/i, 'AT'],
  [/\b(goulash|paprikash|dobos torte)\b/i, 'HU'],
  [/\b(pierogi|paczki|barszcz)\b/i, 'PL'],
  // Greece / Balkans / Levant / Middle East
  [/\b(moussaka|spanakopita|pastitsio|saganaki|tzatziki|avgolemono)\b/i, 'GR'],
  [/\b(hummus|falafel|shakshuka|mejadra|mujaddara|musabaha|maqluba|mansaf|maklouba)\b/i, 'PS'],
  [/\b(tabouleh|tabbouleh|kibbeh|kibbe|fattoush|manakish|sfouf)\b/i, 'LB'],
  [/\b(couscous|tagine|tajine|harira|pastilla|bastilla|chermoula|charmoula)\b/i, 'MA'],
  [/\b(koshari|molokhia|ful medames|foul medames|basbousa)\b/i, 'EG'],
  [/\b(ghormeh sabzi|chelow kebab|fesenjan|ash reshteh|abgoosht|dizi|zereshk polo|baghali polo|kuku sabzi)\b/i, 'IR'],
  [/\b(doner kebab|doner|lahmacun|manti|baklava|menemen|imam bayildi|mercimek corbasi)\b/i, 'TR'],
  // South Asia
  [/\b(biryani|dosa|idli|samosa|palak paneer|butter chicken|tandoori chicken|chana masala|aloo gobi|vindaloo|rogan josh|dal makhani|rajma|paratha)\b/i, 'IN'],
  [/\b(dal bhat|momo)\b/i, 'NP'],
  // East / Southeast Asia
  [/\b(sushi|sashimi|ramen|tempura|okonomiyaki|miso soup|yakitori|onigiri|udon|soba|mochi|teriyaki)\b/i, 'JP'],
  [/\b(kimchi|bibimbap|bulgogi|tteokbokki|kimbap|japchae)\b/i, 'KR'],
  [/\b(pad thai|tom yum|tom kha|green curry|massaman curry|som tam|larb)\b/i, 'TH'],
  [/\b(pho|banh mi|bun cha|goi cuon|bun bo hue|cao lau)\b/i, 'VN'],
  [/\b(nasi goreng|rendang|gado gado|gado-gado|satay|sate ayam|soto ayam)\b/i, 'ID'],
  [/\b(nasi lemak|laksa|char kway teow|roti canai|beef rendang)\b/i, 'MY'],
  [/\b(adobo|sinigang|pancit|lechon)\b/i, 'PH'],
  [/\b(hainanese chicken rice|chilli crab|laksa singapore)\b/i, 'SG'],
  [/\b(amok trey|lok lak|nom banh chok)\b/i, 'KH'],
  // Africa
  [/\b(injera|doro wat|doro wot|tibs|kitfo)\b/i, 'ET'],
  [/\b(jollof rice|egusi soup|suya|pounded yam)\b/i, 'NG'],
  [/\b(bunny chow|bobotie|boerewors|malva pudding)\b/i, 'ZA'],
  [/\b(peri peri chicken|matapa)\b/i, 'MZ'],
  // Americas
  [/\b(tacos al pastor|mole poblano|chiles en nogada|pozole|cochinita pibil|tamales?\s+mexican)\b/i, 'MX'],
  [/\b(ceviche|lomo saltado|aji de gallina|anticuchos)\b/i, 'PE'],
  [/\b(asado|empanadas? argentinas|choripan|milanesa)\b/i, 'AR'],
  [/\b(feijoada|brigadeiro|pao de queijo|moqueca)\b/i, 'BR'],
  [/\b(poutine|tourtiere|montreal smoked meat)\b/i, 'CA'],
  [/\b(arepa|ajiaco|bandeja paisa|sancocho)\b/i, 'CO'],
  [/\b(ropa vieja|mojo pork|moros y cristianos)\b/i, 'CU'],
  [/\b(jamaican jerk|jerk chicken|ackee and saltfish)\b/i, 'JM'],
  [/\b(gumbo|jambalaya|shrimp creole|creole)\b/i, 'US'],
  [/\b(cornbread|pulled pork|biscuits and gravy|buffalo wings|clam chowder|key lime pie|pecan pie|pumpkin pie)\b/i, 'US'],
];

const regionalRules = [
  [/\b(mediterranean|levantine|middle eastern|middle east|maghreb|maghrebi)\b/i, 'regional-not-country-specific'],
  [/\b(south asian|south-east asian|southeast asian|central asian|caribbean|african|north african|latin american)\b/i, 'regional-not-country-specific'],
  [/\b(creole|cajun)\b/i, 'regional-or-cultural'],
];

const globalHighConfidence = [
  /\bpizza\b/i, /\bpasta\b/i, /\bburger(s)?\b/i, /\bhamburger(s)?\b/i,
  /\bfried rice\b/i, /\bnoodle(s)?\b/i, /\bsushi\b/i, /\bramen\b/i,
  /\btaco(s)?\b/i, /\bcurry\b/i, /\bsandwich(es)?\b/i, /\bice cream\b/i,
  /\bcheesecake\b/i, /\bpancake(s)?\b/i, /\bwaffle(s)?\b/i, /\bhot dog(s)?\b/i,
  /\bfrench fries\b/i, /\bchocolate cake\b/i, /\bchocolate chip cookie(s)?\b/i,
  /\bcookies?\b/i, /\bmochi\b/i, /\bdumplings?\b/i,
];

const globalMediumConfidence = [
  /\bshawarma\b/i, /\bfalafel\b/i, /\bhummus\b/i, /\bteriyaki\b/i,
  /\bpad thai\b/i, /\bpho\b/i, /\bbiryani\b/i, /\bempanadas?\b/i,
  /\bcrepes?\b/i, /\bsmoothie(s)?\b/i, /\bmuffin(s)?\b/i,
  /\bdoughnut(s)?\b/i, /\bdonut(s)?\b/i, /\bfried chicken\b/i,
  /\bicebox cake\b/i, /\bmeatloaf\b/i, /\bcoleslaw\b/i,
];

const excludedGlobal = [
  /\bglobal house salad\b/i, /\bworld peace cookies?\b/i, /\bout of this world\b/i,
  /\bworld of\b/i, /\bbest of both worlds\b/i,
];

const genericWords = new Set([
  'basic', 'simple', 'classic', 'best', 'favorite', 'our', 'easy', 'quick', 'ultimate',
  'one', 'day', 'meal', 'meals', 'salad', 'sauce', 'drink', 'cake', 'pie', 'cookies',
]);

const relationPriority = { origin: 4, traditional: 3, associated: 2, popular: 1 };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (text, value) => new RegExp(`\\b${escapeRegex(value)}\\b`, 'i').test(text);

function detectGenericity(name) {
  const tokens = norm(name).split(/\s+/).filter(Boolean);
  if (tokens.length <= 2 && tokens.every((token) => genericWords.has(token))) return true;
  return false;
}

function inferGlobal(recipe, text) {
  const name = norm(recipe.name);
  const cuisine = norm(recipe.cuisine);
  const searchable = norm([name, cuisine, text].filter(Boolean).join(' '));

  if (excludedGlobal.some((rule) => rule.test(name))) {
    return { global: false, confidence: null, evidence: null };
  }
  if (globalHighConfidence.some((rule) => rule.test(name))) {
    return { global: true, confidence: 0.92, evidence: 'globally recognized dish family by recipe name' };
  }
  if (globalMediumConfidence.some((rule) => rule.test(name))) {
    return { global: true, confidence: 0.82, evidence: 'widely internationalized dish family by recipe name' };
  }
  if (/\b(international|world cuisine|worldwide)\b/i.test(cuisine)) {
    return { global: true, confidence: 0.84, evidence: 'explicit global cuisine label' };
  }
  if (globalHighConfidence.some((rule) => rule.test(searchable)) && recipe.cuisine) {
    return { global: true, confidence: 0.88, evidence: 'globally recognized dish family supported by cuisine/description' };
  }
  return { global: false, confidence: null, evidence: null };
}

function infer(recipe) {
  const name = norm(recipe.name);
  const cuisine = norm(recipe.cuisine);
  const text = norm([recipe.name, recipe.native_name, recipe.description].filter(Boolean).join(' '));
  const allText = norm([recipe.name, recipe.native_name, recipe.description, recipe.cuisine].filter(Boolean).join(' '));
  const candidates = new Map();

  const add = (iso2, relationType, confidence, evidence, priority) => {
    const key = `${iso2}:${relationType}`;
    const previous = candidates.get(key);
    const current = { iso2, relation_type: relationType, confidence, evidence, priority };
    if (!previous || priority > previous.priority || (priority === previous.priority && confidence > previous.confidence)) {
      candidates.set(key, current);
    }
  };

  const variantMatch = /\(([^)]*)\)/.exec(recipe.name || '');
  const variantText = variantMatch ? norm(variantMatch[1]) : '';
  const explicitVariantCountries = [...countryAliases.entries()].filter(([alias]) => hasWord(variantText, alias));

  for (const [rule, iso2] of originRules) {
    if (!rule.test(allText)) continue;
    if (
      explicitVariantCountries.length > 0 &&
      explicitVariantCountries.some(([, explicitIso]) => explicitIso !== iso2)
    ) continue;
    add(iso2, 'origin', 0.96, 'strong dish-origin lexicon', 100);
  }

  // Explicit cuisine is strong evidence, but "-inspired" is only associated.
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

  // Compound cultural labels are stronger than the individual words.
  if (/\bfrench canadian\b/i.test(name)) add('CA', 'associated', 0.90, 'compound cultural term: french canadian', 95);
  if (/\bscandinavian\b/i.test(name)) add('SE', 'associated', 0.66, 'regional cultural term: scandinavian', 55);
  if (/\bsouthwestern\b/i.test(name)) add('US', 'associated', 0.64, 'regional cultural term: southwestern', 50);

  const nameAliases = [...countryAliases.entries()].filter(([alias]) => hasWord(name, alias));
  for (const [alias, iso2] of nameAliases) {
    if (alias === 'french' && /\bfrench canadian\b/i.test(name)) continue;
    if (alias === 'america' && /\bnorth america\b/i.test(name)) continue;
    add(iso2, 'associated', 0.74, `recipe.name country/cultural term: ${alias}`, 65);
  }

  // Generic text evidence only adds weak association and never overrides origin/traditional.
  for (const [alias, iso2] of countryAliases) {
    if (nameAliases.some(([knownAlias]) => knownAlias === alias)) continue;
    if (hasWord(text, alias)) add(iso2, 'associated', 0.70, `country/cultural term: ${alias}`, 60);
  }

  // Special compound dish families observed in the corpus.
  const specialDishRules = [
    [/\b(cao lau)\b/i, 'VN', 'named dish family: cao lau'],
    [/\b(charmoula|chermoula)\b/i, 'MA', 'regional condiment family: charmoula'],
    [/\b(panzanella)\b/i, 'IT', 'named Italian dish family: panzanella'],
    [/\b(bresaola)\b/i, 'IT', 'named Italian cured-meat family: bresaola'],
    [/\b(sauerkraut)\b/i, 'DE', 'named Germanic food family: sauerkraut'],
    [/\b(saltimbocca)\b/i, 'IT', 'named Italian dish family: saltimbocca'],
    [/\b(mole)\b/i, 'MX', 'named Mexican sauce family: mole'],
    [/\b(mochi)\b/i, 'JP', 'named Japanese confection family: mochi'],
    [/\b(aioli)\b/i, 'FR', 'named Mediterranean/French-associated sauce family: aioli'],
  ];
  for (const [rule, iso2, evidence] of specialDishRules) {
    if (rule.test(name)) add(iso2, 'associated', evidence.includes('Germanic') ? 0.84 : 0.86, evidence, 78);
  }

  const originCountries = new Set(
    [...candidates.values()].filter((row) => row.relation_type === 'origin').map((row) => row.iso2),
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
    ) bestByCountry.set(candidate.iso2, candidate);
  }

  const relations = [...bestByCountry.values()]
    .map(({ iso2, relation_type, confidence, evidence }) => ({
      iso2,
      relation_type,
      confidence,
      evidence,
      is_primary: relation_type === 'origin',
    }))
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || b.confidence - a.confidence || a.iso2.localeCompare(b.iso2));

  const global = inferGlobal(recipe, text);
  const regional = regionalRules.find(([rule]) => rule.test(allText));
  let unknownReason = null;

  if (!global.global && relations.length === 0) {
    if (regional?.[1] === 'regional-not-country-specific') unknownReason = 'regional_not_country_specific';
    else if (regional?.[1] === 'regional-or-cultural') unknownReason = 'regional_or_cultural';
    else if (detectGenericity(name)) unknownReason = 'generic_recipe_name';
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

  for (const batch of chunk(classifications, 500)) {
    const payload = batch.map((row) => ({
      id: row.id,
      is_global: row.global,
      global_confidence: row.globalConfidence,
      classification_version: VERSION,
    }));
    await rest(`recipes?id=${inFilter(batch.map((row) => row.id))}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
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
  const unknownReasons = {};
  const audit = [];

  for (const recipe of recipes) {
    const result = infer(recipe);
    classifications.push({
      id: recipe.id,
      global: result.global,
      globalConfidence: result.globalConfidence,
      relationCount: result.relations.length,
    });

    if (result.unknownReason) unknownReasons[result.unknownReason] = (unknownReasons[result.unknownReason] || 0) + 1;

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
      resolvedRelations.push({ country: relation.iso2, type: relation.relation_type, confidence: relation.confidence, evidence: relation.evidence });
    }

    if (AUDIT) {
      audit.push({
        id: recipe.id,
        name: recipe.name,
        cuisine: recipe.cuisine,
        global: result.global,
        globalConfidence: result.globalConfidence,
        globalEvidence: result.globalEvidence,
        unknown: result.unknown,
        unknownReason: result.unknownReason,
        relations: resolvedRelations,
      });
    }
  }

  if (!DRY_RUN) {
    for (const source of LEGACY_SOURCES) await removeSource(recipeIds, source);
    await persist(countryRows, classifications);
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
    unknownReasons,
    version: VERSION,
    ...(AUDIT ? { audit } : {}),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
