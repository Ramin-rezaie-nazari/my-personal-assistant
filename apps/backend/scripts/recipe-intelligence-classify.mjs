const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERSION = 'rules-v1';
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_INTELLIGENCE_BATCH || '250'), 25), 1000);
const LIMIT = Math.max(Number(process.env.RECIPE_INTELLIGENCE_LIMIT || '0'), 0);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function rest(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (r.status === 429 || r.status >= 500) { await sleep(750 * 2 ** i); continue; }
      throw new Error(`${r.status} ${path}: ${text}`);
    } catch (e) { last = e; if (i < attempts - 1) await sleep(750 * 2 ** i); }
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
function cleanText(value) { return String(value || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
function ingredientText(raw) {
  if (!raw) return '';
  if (Array.isArray(raw)) return raw.join(' | ').toLowerCase();
  const s = String(raw);
  const matches = s.match(/'(?:\\'|[^'])*'/g);
  return matches?.length ? matches.map(x => x.slice(1, -1).replace(/\\'/g, "'")).join(' | ').toLowerCase() : s.toLowerCase();
}
const cuisineMap = new Map([['american','american'],['italian','italian'],['mexican','mexican'],['french','french'],['indian','indian'],['chinese','chinese'],['japanese','japanese'],['korean','korean'],['thai','thai'],['vietnamese','vietnamese'],['mediterranean','mediterranean'],['middle eastern','middle_eastern'],['turkish','turkish'],['greek','greek'],['spanish','spanish'],['british','british'],['persian','persian'],['south asian','south_asian'],['latin american','latin_american'],['african','african'],['caribbean','caribbean'],['fusion','fusion'],['international','international']]);
const categoryRules=[['salad',/\bsalad\b/],['soup',/\bsoup|stew\b/],['cake',/\bcake\b|cheesecake/],['cookie',/\bcookie|biscuit\b/],['pastry',/\bpastry|tart|pie|croissant|danish\b/],['dessert',/\bdessert|pudding|mousse|ice cream|gelato|sorbet\b/],['drink',/\bshake|smoothie|juice|tea|coffee|latte|cocktail|drink|punch\b/],['bread',/\bbread|loaf|focaccia|naan|flatbread\b/],['sauce',/\bsauce|vinaigrette|gravy\b/],['dip',/\bdip|hummus|salsa\b/],['breakfast',/\bbreakfast|omelet|omelette|pancake|waffle|french toast\b/],['snack',/\bsnack|energy bar|trail mix\b/],['side_dish',/\bside dish|coleslaw|slaw\b/],['appetizer',/\bappetizer|appetiser|starter|bruschetta|spring roll|dumpling\b/],['main_dish',/\bchicken|beef|steak|pasta|rice|curry|taco|pizza|burger|lasagna|casserole|roast|fish|salmon|shrimp|noodle|bowl\b/]];
const blockers={meat:/\b(beef|steak|veal|pork|ham|bacon|prosciutto|sausage|salami|pepperoni|lamb|mutton|venison|chicken|turkey|duck|goose|rabbit|meat|gelatin|lard|tallow)\b/i,fish:/\b(fish|salmon|tuna|cod|trout|anchov|sardine|mackerel|herring|tilapia|sea bass|fish sauce|oyster sauce|shrimp|prawn|crab|lobster|clam|mussel|scallop|octopus|squid)\b/i,dairy:/\b(milk|cream|cheese|butter|ghee|yogurt|yoghurt|whey|casein|lactose|buttermilk|sour cream|creme fraiche)\b/i,egg:/\b(egg|eggs|mayonnaise|mayo)\b/i,honey:/\bhoney\b/i,gluten:/\b(wheat|flour|barley|rye|malt|semolina|couscous|farro|bulgur|seitan)\b/i,nuts:/\b(almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|peanut|peanuts|tree nut|mixed nuts|nut butter)\b/i};
const ambiguous={animal:/\b(stock|broth|bouillon|sauce|seasoning|flavor|flavour|gelatin|rennet|casein|whey)\b/i,dairy:/\b(cream|sauce|spread|seasoning)\b/i,gluten:/\b(sauce|seasoning|broth|stock|flavor|flavour)\b/i,nuts:/\b(pesto|praline|gianduja|nougat|granola)\b/i};
const plantMilkExceptions=/\b(almond milk|soy milk|soya milk|oat milk|coconut milk|rice milk|cashew milk|hazelnut milk)\b/i;
const plantCreamExceptions=/\b(coconut cream|coconut milk|oat cream|soy cream)\b/i;
function dietary(ingredients, recipe) {
  const text=ingredients||''; const hasIngredients=text.trim().length>0; const results=[];
  const dairyHit=blockers.dairy.test(text)&&!plantMilkExceptions.test(text)&&!plantCreamExceptions.test(text);
  const eggHit=blockers.egg.test(text)&&!/eggplant/.test(text); const meatHit=blockers.meat.test(text); const fishHit=blockers.fish.test(text); const honeyHit=blockers.honey.test(text); const glutenHit=blockers.gluten.test(text); const nutsHit=blockers.nuts.test(text);
  const uncertain=()=>({suitability:'uncertain',confidence:0,reason:'No ingredient evidence available.'});
  const vegan=!hasIngredients?uncertain():meatHit||fishHit||dairyHit||eggHit||honeyHit?{suitability:'not_suitable',confidence:.99,reason:'At least one animal-derived ingredient was detected.'}:ambiguous.animal.test(text)?{suitability:'uncertain',confidence:.62,reason:'Potentially animal-derived ingredient category requires normalization.'}:{suitability:'suitable',confidence:.95,reason:'No animal-derived blocker detected in available ingredients.'};
  const vegetarian=!hasIngredients?uncertain():meatHit||fishHit?{suitability:'not_suitable',confidence:.99,reason:'Meat or fish ingredient detected.'}:{suitability:'suitable',confidence:.95,reason:'No meat or fish ingredient detected.'};
  const pescatarian=!hasIngredients?uncertain():meatHit?{suitability:'not_suitable',confidence:.99,reason:'Meat ingredient detected.'}:ambiguous.animal.test(text)?{suitability:'uncertain',confidence:.65,reason:'Potentially animal-derived ingredient category requires normalization.'}:{suitability:'suitable',confidence:.93,reason:'No meat ingredient detected.'};
  const dairy=!hasIngredients?uncertain():dairyHit?{suitability:'not_suitable',confidence:.99,reason:'Dairy ingredient detected.'}:ambiguous.dairy.test(text)?{suitability:'uncertain',confidence:.62,reason:'Potential dairy-containing derivative may require normalization.'}:{suitability:'suitable',confidence:.94,reason:'No direct dairy ingredient detected.'};
  results.push({slug:'vegan',...vegan},{slug:'vegetarian',...vegetarian},{slug:'pescatarian',...pescatarian},{slug:'dairy_free',...dairy});
  results.push({slug:'egg_free',...(eggHit?{suitability:'not_suitable',confidence:.99,reason:'Egg ingredient detected.'}:!hasIngredients?uncertain():{suitability:'suitable',confidence:.94,reason:'No direct egg ingredient detected.'})});
  results.push({slug:'gluten_free',...(glutenHit?{suitability:'not_suitable',confidence:.99,reason:'Gluten-containing ingredient detected.'}:!hasIngredients?uncertain():ambiguous.gluten.test(text)?{suitability:'uncertain',confidence:.65,reason:'Ingredient wording may hide a gluten source.'}:{suitability:'suitable',confidence:.88,reason:'No major gluten ingredient detected; cross-contact/certification not assessed.'})});
  results.push({slug:'nut_free',...(nutsHit?{suitability:'not_suitable',confidence:.99,reason:'Nut ingredient detected.'}:!hasIngredients?uncertain():ambiguous.nuts.test(text)?{suitability:'uncertain',confidence:.68,reason:'Possible hidden nut source needs normalization.'}:{suitability:'suitable',confidence:.88,reason:'No major nut ingredient detected; cross-contact not assessed.'})});
  const kcal=Number(recipe.kcal_per_serving),protein=Number(recipe.protein_g_per_serving),carbs=Number(recipe.carbs_g_per_serving);
  if(Number.isFinite(kcal)) results.push({slug:'low_calorie',suitability:kcal<=500?'suitable':'not_suitable',confidence:.99,reason:`kcal/serving=${kcal}`});
  if(Number.isFinite(protein)) results.push({slug:'high_protein',suitability:protein>=20?'suitable':'not_suitable',confidence:.99,reason:`protein_g/serving=${protein}`});
  if(Number.isFinite(carbs)) results.push({slug:'low_carb',suitability:carbs<=25?'suitable':'not_suitable',confidence:.99,reason:`carbs_g/serving=${carbs}`});
  if(Number.isFinite(carbs)&&carbs<=10&&Number.isFinite(protein)&&protein>=10&&Number.isFinite(kcal)&&kcal>0) results.push({slug:'keto',suitability:'suitable',confidence:.78,reason:`Preliminary macro rule: carbs_g/serving=${carbs}, protein_g/serving=${protein}. Not a clinical keto determination.`});
  const wf=Number.isFinite(kcal)&&kcal<=550&&Number.isFinite(protein)&&protein>=15; results.push({slug:'weight_loss_friendly',suitability:wf?'suitable':'not_suitable',confidence:.82,reason:wf?'Meets preliminary calorie/protein balance rule.':'Does not meet current preliminary calorie/protein balance rule.'});
  return results;
}
function classifyCategories(name){const n=cleanText(name),m=[];for(const [slug,re] of categoryRules)if(re.test(n))m.push({slug,confidence:.90});if(!m.some(x=>x.slug==='main_dish')&&!m.length)m.push({slug:'main_dish',confidence:.55});if(n.includes('healthy')||n.includes('light'))m.push({slug:'healthy',confidence:.82});if(n.includes('quick')||n.includes('easy'))m.push({slug:'quick_easy',confidence:.90});return [...new Map(m.map(x=>[x.slug,x])).values()];}
async function main(){let recipes=await allRows('recipes','id,name,cuisine,kcal_per_serving,protein_g_per_serving,carbs_g_per_serving,classification_version','created_at.asc');if(LIMIT>0)recipes=recipes.slice(0,LIMIT);const raws=await allRows('recipe_source_raw','recipe_id,raw_payload','created_at.asc');const cuisineRows=await allRows('cuisines','id,slug','slug.asc');const categoryRows=await allRows('categories','id,slug','slug.asc');const dietaryRows=await allRows('dietary_profiles','id,slug','slug.asc');const cuisineBySlug=new Map(cuisineRows.map(x=>[x.slug,x.id]));const categoryBySlug=new Map(categoryRows.map(x=>[x.slug,x.id]));const dietaryBySlug=new Map(dietaryRows.map(x=>[x.slug,x.id]));const rawByRecipe=new Map(raws.map(x=>[x.recipe_id,ingredientText(x.raw_payload?.cleaned_ingredients)]));let processed=0,cuisineCount=0,categoryCount=0,dietaryCount=0;for(let start=0;start<recipes.length;start+=BATCH){for(const recipe of recipes.slice(start,start+BATCH)){const ingredients=rawByRecipe.get(recipe.id)||'';const cuisineText=cleanText(recipe.cuisine);const matched=[...cuisineMap.entries()].find(([label])=>cuisineText===label||cuisineText.startsWith(`${label} `)||cuisineText.includes(`${label} /`));if(matched&&cuisineBySlug.has(matched[1])){await rest('recipe_cuisines',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({recipe_id:recipe.id,cuisine_id:cuisineBySlug.get(matched[1]),relation_type:cuisineText.includes('fusion')||cuisineText.includes('inspired')?'inspired':'classified',confidence:.88,source:'recipes.cuisine',evidence:recipe.cuisine})});cuisineCount++;}for(const c of classifyCategories(recipe.name)){const categoryId=categoryBySlug.get(c.slug);if(!categoryId)continue;await rest('recipe_category_relations',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({recipe_id:recipe.id,category_id:categoryId,confidence:c.confidence,source:VERSION,evidence:recipe.name})});categoryCount++;}for(const d of dietary(ingredients,recipe)){const profileId=dietaryBySlug.get(d.slug);if(!profileId)continue;await rest('recipe_dietary_profiles',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({recipe_id:recipe.id,dietary_profile_id:profileId,suitability:d.suitability,confidence:d.confidence,reason:d.reason,source:VERSION,rule_version:VERSION})});dietaryCount++;}await rest(`recipes?id=eq.${encodeURIComponent(recipe.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({classification_version:VERSION})});processed++;}console.log(JSON.stringify({progress:processed,total:recipes.length,cuisineRelations:cuisineCount,categoryRelations:categoryCount,dietaryRelations:dietaryCount},null,2));}console.log(JSON.stringify({status:'complete',processed,cuisineRelations:cuisineCount,categoryRelations:categoryCount,dietaryRelations:dietaryCount,version:VERSION},null,2));}
main().catch(e=>{console.error(e);process.exit(1);});
