const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_NUTRITION_LIMIT || '0'), 0);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_NUTRITION_DRY_RUN || 'false');
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_NUTRITION_BATCH || '200'), 25), 500);
const VERSION = 'nutrition-estimate-v1';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) { await sleep(500 * 2 ** i); continue; }
      throw new Error(`${response.status} ${path}: ${text}`);
    } catch (e) {
      last = e;
      if (i < attempts - 1) await sleep(500 * 2 ** i);
    }
  }
  throw last;
}

async function allRows(table, select, order='id.asc') {
  const rows=[];
  for(let offset=0;;offset+=1000){
    const page=await rest(`${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`);
    rows.push(...(page||[]));
    if(!page||page.length<1000) return rows;
  }
}

const FOOD = [
  ['chicken breast',165,31,0,3.6],['chicken',239,27,0,14],['turkey',189,29,0,7],['beef',250,26,0,17],['pork',242,27,0,14],['salmon',208,20,0,13],['tuna',132,29,0,1],['shrimp',99,24,0,0.3],['fish',130,26,0,3],
  ['egg',143,13,1,10],['milk',61,3.2,4.8,3.3],['cheese',402,25,1.3,33],['butter',717,0.9,0.1,81],['yogurt',61,3.5,4.7,3.3],
  ['rice',130,2.7,28,0.3],['quinoa',120,4.4,21,1.9],['oat',389,17,66,7],['pasta',157,5.8,31,0.9],['noodle',138,4.5,25,2],['bread',265,9,49,3.2],['flour',364,10,76,1],
  ['chickpea',164,8.9,27,2.6],['lentil',116,9,20,0.4],['bean',127,8.7,23,0.5],['tofu',76,8,1.9,4.8],
  ['onion',40,1.1,9.3,0.1],['garlic',149,6.4,33,0.5],['tomato',18,0.9,3.9,0.2],['pepper',31,1,6,0.3],['carrot',41,0.9,10,0.2],['celery',14,0.7,3,0.2],['spinach',23,2.9,3.6,0.4],['kale',35,2.9,4.4,1.5],['broccoli',34,2.8,7,0.4],['eggplant',25,1,6,0.2],['zucchini',17,1.2,3.1,0.3],['cucumber',15,0.7,3.6,0.1],['potato',77,2,17,0.1],['mushroom',22,3.1,3.3,0.3],
  ['apple',52,0.3,14,0.2],['banana',89,1.1,23,0.3],['orange',47,0.9,12,0.1],['lemon',29,1.1,9,0.3],['lime',30,0.7,11,0.2],['cherry',63,1.1,16,0.2],['berry',50,0.8,12,0.4],['mango',60,0.8,15,0.4],
  ['almond',579,21,22,50],['walnut',654,15,14,65],['pecan',691,9,14,72],['pistachio',562,20,28,45],['peanut',567,26,16,49],['cashew',553,18,30,44],['sesame',573,18,23,50],
  ['olive oil',884,0,0,100],['coconut milk',230,2,6,24],['sugar',387,0,100,0],['honey',304,0.3,82,0],
];

function gramsFromLine(line){
  const x=String(line).toLowerCase();
  const m=x.match(/([0-9]+(?:\.[0-9]+)?(?:\s+\d+\/\d+)?|\d+\/\d+)/);
  if(!m) return null;
  const q=m[1].includes('/')?m[1].split('/').reduce((a,b)=>Number(a)/Number(b)):Number(m[1]);
  if(!Number.isFinite(q)) return null;
  if(/\bkg\b|kilogram/.test(x)) return q*1000;
  if(/\blb\b|pound/.test(x)) return q*453.592;
  if(/\boz\b|ounce/.test(x)) return q*28.35;
  if(/\bg\b|gram/.test(x)) return q;
  if(/\bcup\b/.test(x)) return q*150;
  if(/\btbsp\b|tablespoon/.test(x)) return q*14;
  if(/\btsp\b|teaspoon/.test(x)) return q*4.2;
  return null;
}

function estimate(rawIngredients, servings){
  if(!Array.isArray(rawIngredients)||!rawIngredients.length) return null;
  const lines=rawIngredients.map(String);
  let kcal=0,protein=0,carbs=0,fat=0,used=0,weighted=0;
  const evidence=[];
  for(const line of lines){
    const lower=line.toLowerCase();
    const item=FOOD.find(([name])=>lower.includes(name));
    const grams=gramsFromLine(line);
    if(!item||!grams) continue;
    const [,k,p,c,f]=item;
    kcal+=k*grams/100; protein+=p*grams/100; carbs+=c*grams/100; fat+=f*grams/100; used+=1; weighted+=Math.min(1,grams/100);
    evidence.push({ingredient:item[0],grams:Number(grams.toFixed(1))});
  }
  if(!used) return null;
  const confidence=Math.min(0.86,0.35+(used/Math.max(1,lines.length))*0.55+(Math.min(weighted,5)/5)*0.08);
  const s=Number(servings)||1;
  return {version:VERSION,estimated:true,confidence:Number(confidence.toFixed(2)),matched_ingredients:used,total_ingredient_lines:lines.length,per_serving:{kcal:Number((kcal/s).toFixed(1)),protein_g:Number((protein/s).toFixed(1)),carbs_g:Number((carbs/s).toFixed(1)),fat_g:Number((fat/s).toFixed(1))},evidence:evidence.slice(0,60)};
}

function parseRaw(value){
  if(Array.isArray(value)) return value;
  try{const parsed=JSON.parse(String(value||'').replace(/'/g,'"')); if(Array.isArray(parsed)) return parsed;}catch{}
  return String(value||'').replace(/^\[|\]$/g,'').split(/',\s*'|",\s*"/).map((x)=>x.replace(/^['\"]|['\"]$/g,'').trim()).filter(Boolean);
}

async function main(){
  let recipes=await allRows('recipes','id,servings,kcal_per_serving,protein_g_per_serving,carbs_g_per_serving,fat_g_per_serving','created_at.asc');
  if(LIMIT>0) recipes=recipes.slice(0,LIMIT);
  const raws=await allRows('recipe_source_raw','recipe_id,raw_ingredients','created_at.asc');
  const byId=new Map(raws.map((x)=>[x.recipe_id,x.raw_ingredients]));
  let processed=0,estimated=0;
  for(let i=0;i<recipes.length;i+=BATCH){
    for(const r of recipes.slice(i,i+BATCH)){
      if(r.kcal_per_serving!=null&&r.protein_g_per_serving!=null){processed+=1;continue;}
      const result=estimate(parseRaw(byId.get(r.id)),r.servings);
      if(result&&!DRY_RUN){
        const existing=await rest(`recipe_intelligence_profiles?recipe_id=eq.${r.id}&select=evidence&limit=1`);
        const evidence=existing?.[0]?.evidence&&typeof existing[0].evidence==='object'?existing[0].evidence:{};
        await rest(`recipe_intelligence_profiles?recipe_id=eq.${r.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({evidence:{...evidence,nutrition_estimation:result}})});
        estimated+=1;
      } else if(result) estimated+=1;
      processed+=1;
    }
    console.log(JSON.stringify({progress:processed,total:recipes.length,estimated},null,2));
  }
  console.log(JSON.stringify({status:'complete',mode:DRY_RUN?'dry-run':'apply',processed,total:recipes.length,estimated,version:VERSION},null,2));
}
main().catch((e)=>{console.error(e);process.exit(1);});
