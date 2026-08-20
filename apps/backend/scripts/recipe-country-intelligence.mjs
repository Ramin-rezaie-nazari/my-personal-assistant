import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROOT = process.env.RECIPE_COUNTRY_DATASET_DIR || path.resolve(process.cwd(), 'data');
const CSV = path.join(ROOT, 'countries-195.csv');
const LIMIT = Math.max(Number(process.env.RECIPE_COUNTRY_LIMIT || '0'), 0);
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_COUNTRY_BATCH || '200'), 25), 500);
const VERSION = 'country-rules-v1';
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(pathname, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (r.status === 429 || r.status >= 500) { await sleep(500 * 2 ** i); continue; }
      throw new Error(`${r.status} ${pathname}: ${text}`);
    } catch (e) {
      last = e;
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
function norm(v) { return String(v || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
function csvParse(text) {
  const lines = text.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [iso2, iso3, name, continent, subregion] = lines[i].split(',');
    if (iso2 && iso3 && name) out.push({ iso2, iso3, name, continent, subregion });
  }
  return out;
}

const countryNameAliases = new Map([
  ['usa','US'],['united states','US'],['america','US'],['american','US'],['uk','GB'],['britain','GB'],['british','GB'],['england','GB'],
  ['italian','IT'],['italy','IT'],['french','FR'],['france','FR'],['spanish','ES'],['spain','ES'],['german','DE'],['germany','DE'],
  ['mexican','MX'],['mexico','MX'],['indian','IN'],['india','IN'],['chinese','CN'],['china','CN'],['japanese','JP'],['japan','JP'],
  ['korean','KR'],['korea','KR'],['thai','TH'],['thailand','TH'],['vietnamese','VN'],['vietnam','VN'],['turkish','TR'],['turkey','TR'],
  ['persian','IR'],['iranian','IR'],['iran','IR'],['greek','GR'],['greece','GR'],['portuguese','PT'],['portugal','PT'],
  ['moroccan','MA'],['morocco','MA'],['lebanese','LB'],['lebanon','LB'],['palestinian','PS'],['palestine','PS'],['egyptian','EG'],['egypt','EG'],
  ['ethiopian','ET'],['ethiopia','ET'],['nigerian','NG'],['nigeria','NG'],['south african','ZA'],['south africa','ZA'],
  ['brazilian','BR'],['brazil','BR'],['argentinian','AR'],['argentina','AR'],['peruvian','PE'],['peru','PE'],
  ['colombian','CO'],['colombia','CO'],['jamaican','JM'],['jamaica','JM'],['cuban','CU'],['cuba','CU'],
  ['caribbean','JM'],['african','ZA'],['mediterranean','GR'],
]);

const strongDishOrigins = [
  [/\b(neapolitan pizza|margherita pizza|pizza napoletana)\b/i, 'IT'],[/\b(carbonara|cacio e pepe|ossobuco|osso buco|risotto alla milanese|tiramisu|tiramisu)\b/i,'IT'],
  [/\b(paella|gazpacho|tortilla espanola|churros)\b/i,'ES'],[/\b(coq au vin|ratatouille|bouillabaisse|quiche lorraine|creme brulee|cr[eè]me brulee)\b/i,'FR'],
  [/\b(sushi|sashimi|ramen|tempura|okonomiyaki|miso soup)\b/i,'JP'],[/\b(kimchi|bibimbap|bulgogi|tteokbokki)\b/i,'KR'],
  [/\b(pad thai|tom yum|tom kha|green curry|massaman curry)\b/i,'TH'],[/\b(pho|banh mi|bun cha)\b/i,'VN'],
  [/\b(tacos al pastor|mole poblano|chiles en nogada|pozole)\b/i,'MX'],[/\b(biryani|dosa|idli|samosa|palak paneer|butter chicken|tandoori chicken)\b/i,'IN'],
  [/\b(hummus|falafel|shakshuka)\b/i,'PS'],[/\b(tabouleh|tabbouleh|kibbeh)\b/i,'LB'],[/\b(couscous|tagine|tajine)\b/i,'MA'],
  [/\b(jollof rice)\b/i,'NG'],[/\b(injera|doro wat|doro wot)\b/i,'ET'],[/\b(feijoada|brigadeiro|pao de queijo)\b/i,'BR'],
  [/\b(ceviche|lomo saltado|aji de gallina)\b/i,'PE'],[/\b(asado|empanadas? argentinas)\b/i,'AR'],[/\b(goulash)\b/i,'HU'],
  [/\b(moussaka|spanakopita)\b/i,'GR'],[/\b(kebab|doner|doner kebab|lahmacun|baklava)\b/i,'TR'],
  [/\b(pho|goi cuon|bun bo hue)\b/i,'VN'],[/\b(sauerbraten|bratwurst|pretzel|kartoffelpuffer)\b/i,'DE'],
  [/\b(fish and chips|shepherds? pie|beef wellington|sticky toffee pudding)\b/i,'GB'],
  [/\b(poutine|tourtiere|tourtière)\b/i,'CA'],[/\b(hainanese chicken rice)\b/i,'SG'],[/\b(nasi goreng|rendang|gado gado|gado-gado)\b/i,'ID'],
  [/\b(nasi lemak|laksa|char kway teow)\b/i,'MY'],[/\b(adobo|sinigang|pancit)\b/i,'PH'],[/\b(amok trey|lok lak)\b/i,'KH'],
  [/\b(satay|sate ayam)\b/i,'ID'],[/\b(borscht|pelmeni)\b/i,'UA'],[/\b(plov|osh)\b/i,'UZ'],[/\b(manti)\b/i,'KG'],
  [/\b(ghormeh sabzi|ghormeh sabzi|chelow kebab|fesenjan|ash reshteh|abgoosht|dizi)\b/i,'IR'],
  [/\b(dal bhat|momo)\b/i,'NP'],[/\b(erkesso|tibs)\b/i,'ET'],[/\b(peri peri|peri-peri chicken)\b/i,'MZ'],
];

const globalPatterns = [
  /\bpizza\b/i,/\bpasta\b/i,/\bburger\b/i,/\bfried rice\b/i,/\bcurry\b/i,/\bnoodle(s)?\b/i,/\bice cream\b/i,/\bcake\b/i,/\bcheesecake\b/i,
  /\btaco(s)?\b/i,/\bsandwich\b/i,/\bsoup\b/i,/\bsalad\b/i,/\bpancake(s)?\b/i,/\bwaffle(s)?\b/i,/\bcookie(s)?\b/i,
];

function infer(recipe) {
  const text = norm([recipe.name, recipe.native_name, recipe.description, recipe.cuisine].filter(Boolean).join(' '));
  const relations = new Map();
  const add = (iso2, type, confidence, evidence) => {
    if (!iso2) return;
    const key = `${iso2}:${type}`;
    const prev = relations.get(key);
    if (!prev || confidence > prev.confidence) relations.set(key, { iso2, relation_type: type, confidence, evidence });
  };
  for (const [re, iso2] of strongDishOrigins) if (re.test(text)) add(iso2, 'origin', 0.93, 'strong dish-origin lexicon');
  for (const [alias, iso2] of countryNameAliases) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\b`, 'i');
    if (re.test(text)) add(iso2, 'associated', 0.82, `country/cuisine term: ${alias}`);
  }
  if (recipe.cuisine) {
    const c = norm(recipe.cuisine);
    const explicitCuisine = [...countryNameAliases.entries()].filter(([alias]) => c.includes(alias));
    for (const [alias, iso2] of explicitCuisine) add(iso2, c.includes('inspired') ? 'associated' : 'traditional', c.includes('inspired') ? 0.76 : 0.86, `recipe.cuisine=${recipe.cuisine}`);
  }
  const global = globalPatterns.some((re) => re.test(text));
  const globalConfidence = global ? 0.78 : 0;
  return { relations: [...relations.values()], global, globalConfidence };
}

async function seedCountries(countries) {
  for (let i = 0; i < countries.length; i += 500) {
    const rows = countries.slice(i, i + 500).map((c) => ({ iso2: c.iso2, iso3: c.iso3, name: c.name, continent: c.continent, subregion: c.subregion, target_recipes: 100, minimum_recipes: 20, is_active: true }));
    await rest('countries?on_conflict=iso2', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
  }
}

async function main() {
  const countries = csvParse(await fs.readFile(CSV, 'utf8'));
  if (countries.length !== 195) throw new Error(`Expected 195 countries, found ${countries.length}`);
  await seedCountries(countries);
  const dbCountries = await allRows('countries', 'id,iso2,iso3,name', 'iso2.asc');
  const byIso = new Map(dbCountries.map((c) => [c.iso2, c.id]));
  let recipes = await allRows('recipes', 'id,name,native_name,description,cuisine', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);

  const countryRows = [];
  const globalIds = [];
  for (const recipe of recipes) {
    const out = infer(recipe);
    if (out.global) globalIds.push(recipe.id);
    for (const rel of out.relations) {
      const countryId = byIso.get(rel.iso2);
      if (!countryId) continue;
      countryRows.push({ recipe_id: recipe.id, country_id: countryId, relation_type: rel.relation_type, confidence: rel.confidence, source: VERSION, source_ref: 'local-lexicon', evidence: rel.evidence, is_primary: rel.relation_type === 'origin' });
    }
  }

  for (let i = 0; i < countryRows.length; i += BATCH) {
    await rest('recipe_country_relations', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(countryRows.slice(i, i + BATCH)) });
  }

  for (let i = 0; i < globalIds.length; i += 500) {
    const ids = globalIds.slice(i, i + 500);
    const encoded = ids.map((id) => `\"${id}\"`).join(',');
    await rest(`recipes?id=in.(${ids.join(',')})`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_global: true, global_confidence: 0.78 }) });
  }

  console.log(JSON.stringify({ status: 'complete', countriesSeeded: countries.length, recipesProcessed: recipes.length, countryRelations: countryRows.length, globalRecipes: globalIds.length, version: VERSION }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
