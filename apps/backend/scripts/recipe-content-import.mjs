import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const DATASET_SOURCE = 'Wikibooks Cookbook';
const DATASET_LICENSE = 'CC BY-SA 4.0';
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMPORT_BATCH_SIZE ?? 250), 1), 500);
const OFFSET = Math.max(Number(process.env.RECIPE_IMPORT_OFFSET ?? 0), 0);
const LIMIT = Math.max(Number(process.env.RECIPE_IMPORT_LIMIT ?? 0), 0);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMPORT_CONCURRENCY ?? 3), 1), 6);
const IMPORT_MEDIA = process.env.RECIPE_IMPORT_MEDIA !== '0';
const MAX_MEDIA_PER_RECIPE = Math.min(Math.max(Number(process.env.RECIPE_MAX_MEDIA ?? 4), 1), 4);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function clean(value = '') { return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim(); }
function parseFraction(text) { const u={ '½':.5,'⅓':1/3,'⅔':2/3,'¼':.25,'¾':.75,'⅕':.2,'⅖':.4,'⅗':.6,'⅘':.8,'⅙':1/6,'⅚':5/6,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875 }; let total=0,found=false; for(const m of String(text).matchAll(/\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g)){found=true;total += m[0] in u ? u[m[0]] : Number(m[0]);} return found ? total : null; }
function parseIngredient(raw) {
  const text=clean(raw);
  const leading=text.match(/^((?:\d+(?:\.\d+)?\s*)?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/u);
  if(!leading) return {name:text,quantity:1,unit:'as listed',measurementKind:'text',scalingPolicy:'manual'};
  const quantity=parseFraction(leading[1]);
  if(!quantity || !Number.isFinite(quantity)) return {name:text,quantity:1,unit:'as listed',measurementKind:'text',scalingPolicy:'manual'};
  const rest=leading[2].trim();
  const unit=rest.match(/^(kg|g|mg|lb|lbs|oz|ml|l|liter|litre|liters|litres|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pint|pints|quart|quarts|gallon|gallons|clove|cloves|piece|pieces|can|cans|package|packages|slice|slices|pinch|pinches)\b[.]?\s+(.*)$/i);
  return unit ? {name:unit[2].trim(),quantity,unit:unit[1].toLowerCase(),measurementKind:'quantity',scalingPolicy:'linear'} : {name:rest || text,quantity,unit:'item',measurementKind:'count',scalingPolicy:'linear'};
}
function parseRecipe(row){
  const data=row?.recipe_data ?? row ?? {}; const lines=Array.isArray(data.text_lines)?data.text_lines:[];
  const title=clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i,'') || 'Untitled Recipe');
  const ingredients=lines.filter((x)=>x?.line_type==='ul' && /ingredient/i.test(x.section||'')).map((x)=>parseIngredient(x.text)).filter((x)=>x.name);
  const procedures=lines.filter((x)=>x?.line_type==='ol' && /procedure|direction|method|instruction|preparation/i.test(x.section||'')).map((x)=>clean(x.text)).filter((x)=>x.length>=20);
  const paragraphs=lines.filter((x)=>x?.line_type==='p' && !/contributor|source/i.test(x.section||'')).map((x)=>clean(x.text)).filter(Boolean);
  return {title,description:paragraphs.find((x)=>!/^from the original recipe contributor/i.test(x))??null,servings:Math.max(1,Math.min(100,Math.round(Number(String(data.infobox?.servings??'').match(/\d+(?:\.\d+)?/)?.[0]||2)))),category:clean(String(data.infobox?.category||'').replace(/^\/wiki\/Category:/,'').replace(/_/g,' '))||'general',url:data.url||null,ingredients,procedures};
}
async function fetchJson(url,attempts=5){let last;for(let i=0;i<attempts;i++){try{const r=await fetch(url,{headers:{'User-Agent':'MYPA-RecipeImporter/2.0'}});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}catch(e){last=e;await sleep(700*2**i)}}throw last}
async function loadDataset(){const data=await fetchJson(DATASET_URL);if(!Array.isArray(data))throw new Error('Recipe dataset JSON was not an array.');return data;}
async function getOrCreateFood(tx, ingredient){const existing=await tx.foodItem.findFirst({where:{userId:null,name:ingredient.name}});if(existing)return existing;return tx.foodItem.create({data:{id:randomUUID(),userId:null,name:ingredient.name,category:'recipe ingredient',verified:false,calories:0,protein:0,carbs:0,fat:0,imageUrl:null,imageSource:null}})}
async function importRecipe(parsed){
  if(!parsed.title)return {status:'skipped',reason:'missing title'};
  return prisma.$transaction(async(tx)=>{
    const existing=await tx.recipe.findFirst({where:{userId:null,name:parsed.title}});
    const recipe=existing?await tx.recipe.update({where:{id:existing.id},data:{description:parsed.description,servings:parsed.servings,verified:false}}):await tx.recipe.create({data:{id:randomUUID(),userId:null,name:parsed.title,description:parsed.description,servings:parsed.servings,calories:0,protein:0,carbs:0,fat:0,verified:false}});
    await tx.recipeStep.deleteMany({where:{recipeId:recipe.id}});
    await tx.recipeIngredient.deleteMany({where:{recipeId:recipe.id}});
    for(const ingredient of parsed.ingredients){const food=await getOrCreateFood(tx,ingredient);await tx.recipeIngredient.create({data:{id:randomUUID(),recipeId:recipe.id,foodId:food.id,quantity:ingredient.quantity,unit:ingredient.unit,measurementKind:ingredient.measurementKind,scalingPolicy:ingredient.scalingPolicy,calories:0,protein:0,carbs:0,fat:0}})}
    for(const [index,instruction] of parsed.procedures.entries()) await tx.recipeStep.create({data:{id:randomUUID(),recipeId:recipe.id,stepNumber:index+1,instruction,sourceLicense:DATASET_LICENSE,sourceAttribution:`${DATASET_SOURCE}; source page: ${parsed.url??'dataset row'}`}});
    if(IMPORT_MEDIA) await tx.recipeMedia.deleteMany({where:{recipeId:recipe.id}});
    return {status:'imported',recipeId:recipe.id,ingredientCount:parsed.ingredients.length,stepCount:parsed.procedures.length,mediaCount:0};
  });
}
async function mapConcurrent(items,limit,worker){const out=new Array(items.length);let cursor=0;async function runner(){while(true){const i=cursor++;if(i>=items.length)return;try{out[i]=await worker(items[i])}catch(e){out[i]={status:'failed',error:e instanceof Error?e.message:String(e)}}}}await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>runner()));return out;}
async function main(){
  const dataset=await loadDataset();
  const end=LIMIT>0?Math.min(dataset.length,OFFSET+LIMIT):dataset.length;
  const batch=dataset.slice(OFFSET,Math.min(end,OFFSET+BATCH_SIZE));
  if(!batch.length){console.log(JSON.stringify({status:'complete',datasetRows:dataset.length,offset:OFFSET,limit:LIMIT||null,message:'No rows remain in selected range.'},null,2));return;}
  const results=await mapConcurrent(batch.map(parseRecipe),CONCURRENCY,importRecipe);
  const stats={datasetRows:dataset.length,offset:OFFSET,batchRows:batch.length,imported:results.filter(x=>x?.status==='imported').length,skipped:results.filter(x=>x?.status==='skipped').length,failed:results.filter(x=>x?.status==='failed').length,stepsImported:results.reduce((s,x)=>s+Number(x?.stepCount||0),0)};
  console.log(JSON.stringify({source:DATASET_SOURCE,license:DATASET_LICENSE,...stats,nextOffset:OFFSET+batch.length},null,2));
  if(stats.failed>0&&stats.imported===0)process.exitCode=1;
}
main().catch((e)=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
