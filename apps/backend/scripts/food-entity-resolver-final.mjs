import taxonomy from '../data/ingredient-taxonomy-v1.json' with { type: 'json' };
import supplement from '../data/ingredient-taxonomy-supplement-v1.json' with { type: 'json' };
import supplementV2 from '../data/ingredient-taxonomy-supplement-v2.json' with { type: 'json' };
import supplementV3 from '../data/ingredient-taxonomy-supplement-v3.json' with { type: 'json' };
import supplementV4 from '../data/ingredient-taxonomy-supplement-v4.json' with { type: 'json' };
import supplementV5 from '../data/ingredient-taxonomy-supplement-v5.json' with { type: 'json' };
import supplementV6 from '../data/ingredient-taxonomy-supplement-v6.json' with { type: 'json' };
import supplementV7 from '../data/ingredient-taxonomy-supplement-v7.json' with { type: 'json' };
import supplementV8 from '../data/ingredient-taxonomy-supplement-v8.json' with { type: 'json' };
import knowledge from '../data/food-entity-knowledge-v1.json' with { type: 'json' };
import locales from '../data/food-entity-locale-pack-v1.json' with { type: 'json' };
import { normalizeQuantity } from './food-quantity-normalizer.mjs';

export const RESOLVER_VERSION = 'food-entity-resolver-final-v11';

const all = [...taxonomy, ...supplement, ...supplementV2, ...supplementV3, ...supplementV4, ...supplementV5, ...supplementV6, ...supplementV7, ...supplementV8];
const knowledgeById = new Map(knowledge.map((x) => [x.id, x]));
const canonicalRedirects = new Map([['simple_syrup', 'syrup_simple']]);
function canonicalId(id) { return canonicalRedirects.get(id) || id; }
function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/(\d)\s*[⁄/]\s*(\d)/g, '$1/$2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function stripPrep(value) {
  return String(value || '')
    .replace(/^\s*equipment\s*:\s*/i, ' ')
    .replace(/^\s*(?:an?|one)\s+(?:instant[- ]read|deep[- ]fat|candy)\s+thermometer\b.*$/i, ' ')
    .replace(/^\s*\d+(?:\s+\d+\/\d+)?\s*(?:[-–]\s*\d+(?:\s+\d+\/\d+)?)?\s*(?:ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|ml|milliliter|milliliters|liter|liters)\s+/i, ' ')
    .replace(/^\s*\d+(?:\/\d+)?(?:\s+\d+\/\d+)?\s*(?:[-–]\s*\d+(?:\s+\d+\/\d+)?)?\s*(?:inch|inches|in|cm|mm)\s+(?:pieces?|cubes?|slices?|planks?|thick)\s+/i, ' ')
    .replace(/^\s*\d+(?:\s+\d+\/\d+)?\s*(?:to|[-–])\s*\d+(?:\s+\d+\/\d+)?\s*(?:cup|cups|teaspoon|teaspoons|tbsp|tablespoon|tablespoons|ounce|ounces|oz|pound|pounds|lb|lbs|package|packages|bag|bags|box|boxes|can|cans)\s+/i, ' ')
    .replace(/^\s*\d+\s*[-–]\s*\d+\s*percent[- ]lean\s+/i, ' ')
    .replace(/^\s*\d+\s*percent[- ]lean\s+/i, ' ')
    .replace(/^\s*\d+(?:\.\d+)?%\s+(?=(?:buttermilk|milk)\b)/i, ' ')
    .replace(/\b(?:\d+(?:\.\d+)?\s*)?(?:ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|ml|milliliter|milliliters|liter|liters)\s+(?:bottle|can|package|pkg|jar|bag|box|carton)\b/gi, ' ')
    .replace(/\b(?:bottle|bottles|can|cans|package|packages|pkg|jar|jars|bag|bags|box|boxes|carton|cartons)\b/gi, ' ')
    .replace(/^\s*(?:additional|plus(?:\s+(?:extra|more))?)\s+/i, ' ')
    .replace(/\b(?:small|medium|large|extra large|baby|young|tiny|mini|ripe|firm ripe|high quality|high-quality)\b/gi, ' ')
    .replace(/\b(?:freshly|fresh|finely|coarsely|roughly|thinly|thickly|lightly|heaping|packed|divided|melted|softened|chopped|diced|minced|sliced|grated|shredded|peeled|seeded|cored|boneless|skinless|trimmed|quartered|split|sifted|julienned|shucked|drained|rinsed|washed|shelled|husked|hulled|toasted|roasted|cooked|raw|optional|halved|lengthwise|at room temperature)\b/gi, ' ')
    .replace(/\b(?:seeds? removed|casings? removed|skin removed|skin on|bone[- ]in|bones? removed|center membrane removed|tough outer (?:layers|leaves) removed|picked over|wiped clean|tough ligament removed)\b/gi, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:for garnish|for serving|for frying|for dusting|for brushing|for drizzling|to taste|as needed|plus more|plus extra|or more)\b.*$/i, ' ')
    .replace(/[,*:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function canonicalizeText(value) { return stripPrep(norm(value)); }

const aliasEntries = [];
const aliasMap = new Map();
function registerAlias(alias, entry, priority) {
  const key = norm(alias); if (!key) return;
  const candidate = { ...entry, id: canonicalId(entry.id), key, priority };
  const existing = aliasMap.get(key);
  if (!existing || priority > existing.priority || (priority === existing.priority && candidate.id === existing.id)) aliasMap.set(key, candidate);
}
for (const item of all) for (const alias of [item.name, ...(item.aliases || [])]) registerAlias(alias, { id: item.id, name: item.name, category: item.category || 'food', source: 'taxonomy', locale: null }, 20);
for (const item of knowledge) for (const alias of [item.name, ...(item.aliases || [])]) registerAlias(alias, { id: item.id, name: item.name, category: item.category || 'food', source: 'knowledge', locale: null }, 30);
for (const pack of locales) for (const [id, names] of Object.entries(pack.aliases || {})) for (const alias of names) registerAlias(alias, { id, name: knowledgeById.get(canonicalId(id))?.name || id, category: knowledgeById.get(canonicalId(id))?.category || 'food', source: 'locale', locale: pack.locale }, 40);
const semanticOverrides = [
  ['herbs','culinary_herbs','culinary herbs','herb_spice'],['fresh herbs','culinary_herbs','culinary herbs','herb_spice'],['mixed herbs','culinary_herbs','culinary herbs','herb_spice'],['mixed tender herbs','culinary_herbs','culinary herbs','herb_spice'],['culinary herbs','culinary_herbs','culinary herbs','herb_spice'],
  ['prepared white horseradish','prepared_horseradish','prepared horseradish','condiment'],['prepared horseradish','prepared_horseradish','prepared horseradish','condiment'],['bottled horseradish','prepared_horseradish','prepared horseradish','condiment'],['simple syrup','syrup_simple','simple syrup','sweetener'],
  ['additional olive oil','olive_oil','olive oil','oil_fat'],['additional powdered sugar','powdered_sugar','powdered sugar','sweetener'],['drops yellow food coloring','food_coloring','food coloring','food_additive'],['frozen blackberries','blackberry','blackberry','fruit'],['frozen raspberries','raspberry','raspberry','fruit'],
  ['green chilies','green_chile','green chile','pepper'],['green thai chiles','thai_chile','thai chile','pepper'],['red thai chiles','thai_chile','thai chile','pepper'],['ground chia seeds','chia_seed','chia seed','seed'],['ground flax','flaxseed','flaxseed','seed'],['ground flaxseed','flaxseed','flaxseed','seed'],['miso','miso','miso','condiment'],['neutral oil','neutral_oil','neutral oil','oil_fat'],['polenta *','polenta','polenta','grain'],['quick cooking polenta','polenta','polenta','grain'],['popcorn kernels','popcorn_kernel','popcorn kernel','grain'],['rum','rum','rum','alcohol'],
];
for (const [alias,id,name,category] of semanticOverrides) registerAlias(alias,{id,name,category,source:'semantic-override',locale:null},100);
for (const entry of aliasMap.values()) aliasEntries.push(entry);
aliasEntries.sort((a,b)=>b.key.length-a.key.length || b.priority-a.priority || a.id.localeCompare(b.id));
function score(text,key){
  if(text===key)return 1; const tokens=text.split(' ').filter(Boolean); const keys=key.split(' ').filter(Boolean); if(keys.length>tokens.length)return 0; if(text.startsWith(`${key} `)||text.endsWith(` ${key}`))return 0.91; const hit=keys.filter((token)=>tokens.includes(token)).length/keys.length; return hit>=1?0.82+Math.min(0.07,hit*0.07):0;
}
function findBest(cleaned){
  const exact=aliasMap.get(cleaned); if(exact)return {entry:exact,score:1,matchedBy:'exact'};
  let best=null;
  for(const entry of aliasEntries){ const candidateScore=score(cleaned,entry.key); if(!candidateScore)continue; if(!best||candidateScore>best.score||(candidateScore===best.score&&entry.key.length>best.entry.key.length)) best={entry,score:candidateScore,matchedBy:candidateScore>0.9?'fuzzy-high':'fuzzy'}; }
  return best;
}
function result(raw,entry,quantityData,matchedBy){
  const id=canonicalId(entry.id); const knowledgeItem=knowledgeById.get(id); const confidence=entry.source==='knowledge'||entry.source==='locale'||entry.source==='semantic-override'?0.99:matchedBy==='exact'?0.985:0.93;
  return {
    resolver_version:RESOLVER_VERSION,
    raw,
    normalized:canonicalizeText(quantityData.remainder),
    canonical_id:id,
    canonical_name:knowledgeItem?.name||entry.name,
    category:knowledgeItem?.category||entry.category,
    matched_by:matchedBy,
    matched_alias:entry.key,
    quantity:quantityData.quantity,
    quantity_min:quantityData.quantity_min ?? null,
    quantity_max:quantityData.quantity_max ?? null,
    is_range:quantityData.is_range ?? false,
    unit:quantityData.unit,
    additional_quantity:quantityData.additional_quantity ?? null,
    additional_unit:quantityData.additional_unit ?? null,
    package_size:quantityData.package_size ?? null,
    package_size_min:quantityData.package_size_min ?? null,
    package_size_max:quantityData.package_size_max ?? null,
    package_size_unit:quantityData.package_size_unit ?? null,
    package_type:quantityData.package_type ?? null,
    package_modifier:quantityData.package_modifier ?? null,
    confidence,
    review_required:false,
    parent_id:knowledgeItem?.parent_id||null,
    relations:knowledgeItem?.relations||[],
    locale:entry.locale||null
  };
}
export function resolveFoodEntity(input){
  const raw=String(input||'').trim();
  if(!raw)return {resolver_version:RESOLVER_VERSION,raw,canonical_id:null,review_required:true,confidence:0,reason:'empty_input'};
  const quantityData=normalizeQuantity(raw); const cleaned=canonicalizeText(quantityData.remainder);
  const alternativeParts=cleaned.split(/\s+or\s+/i).map((x)=>x.trim()).filter(Boolean);
  if(alternativeParts.length>=2){
    const candidates=alternativeParts.map(findBest).filter((x)=>x&&x.score>=0.9).map((x)=>({canonical_id:canonicalId(x.entry.id),canonical_name:x.entry.name,confidence:x.score}));
    const distinct=[...new Map(candidates.map((x)=>[x.canonical_id,x])).values()];
    if(distinct.length>=2)return {resolver_version:RESOLVER_VERSION,raw,normalized:cleaned,canonical_id:null,canonical_name:null,quantity:quantityData.quantity,quantity_min:quantityData.quantity_min ?? null,quantity_max:quantityData.quantity_max ?? null,is_range:quantityData.is_range ?? false,unit:quantityData.unit,additional_quantity:quantityData.additional_quantity ?? null,additional_unit:quantityData.additional_unit ?? null,confidence:0,review_required:true,relations:[],reason:'ambiguous_alternatives',alternatives:distinct};
  }
  const best=findBest(cleaned);
  if(!best||best.score<0.8)return {resolver_version:RESOLVER_VERSION,raw,normalized:cleaned,canonical_id:null,canonical_name:null,quantity:quantityData.quantity,quantity_min:quantityData.quantity_min ?? null,quantity_max:quantityData.quantity_max ?? null,is_range:quantityData.is_range ?? false,unit:quantityData.unit,additional_quantity:quantityData.additional_quantity ?? null,additional_unit:quantityData.additional_unit ?? null,confidence:0,review_required:true,relations:[],reason:'unresolved_offline'};
  return result(raw,best.entry,quantityData,best.matchedBy);
}
export function resolverIntegrity(){
  const ids=new Set([...all.map((x)=>canonicalId(x.id)),...knowledge.map((x)=>canonicalId(x.id)),...semanticOverrides.map(([,id])=>canonicalId(id))]); const conflicts=[]; const seen=new Map();
  for(const entry of aliasEntries){const previous=seen.get(entry.key); if(previous&&canonicalId(previous.id)!==canonicalId(entry.id))conflicts.push({alias:entry.key,ids:[canonicalId(previous.id),canonicalId(entry.id)]}); seen.set(entry.key,entry);}
  return {version:RESOLVER_VERSION,taxonomy_entries:all.length,knowledge_entries:knowledge.length,alias_entries:aliasEntries.length,conflicting_aliases:conflicts,canonical_redirects:Object.fromEntries(canonicalRedirects),valid:ids.size>0&&conflicts.length===0};
}
