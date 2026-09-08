import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST_DIR = path.join(ROOT, 'manifest');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-heroes.jsonl');
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const DATASET_SOURCE = 'Food Ingredients and Recipes Dataset with Images';
const PAGE_SIZE = 1000;
const MAX_BYTES = 150 * 1024;
const MIN_BYTES = 20 * 1024;
const MIN_SIDE = 640;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const exists=(p)=>{try{fsSync.accessSync(p);return true;}catch{return false;}};
const now=()=>new Date().toISOString();
async function rest(url){const r=await fetch(`${SUPABASE_URL}/rest/v1/${url}`,{headers});const text=await r.text();if(!r.ok)throw new Error(`${r.status} ${url}: ${text}`);return text?JSON.parse(text):[];}
async function allHeroes(){const rows=[];for(let offset=0;;offset+=PAGE_SIZE){const page=await rest(`recipe_images?select=recipe_id,image_url,storage_key,width,height,byte_size,mime_type,source_name,source_url,source_license,source_attribution&image_type=eq.hero&source_name=eq.${encodeURIComponent(DATASET_SOURCE)}&order=recipe_id.asc&limit=${PAGE_SIZE}&offset=${offset}`);rows.push(...page);if(page.length<PAGE_SIZE)break;}return rows;}
async function recipes(){const rows=[];for(let offset=0;;offset+=PAGE_SIZE){const page=await rest(`recipes?select=id,name&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`);rows.push(...page);if(page.length<PAGE_SIZE)break;}return new Map(rows.map(r=>[String(r.id),String(r.name||'')]));}
async function loadManifest(){try{const text=await fs.readFile(MANIFEST_PATH,'utf8');const map=new Map();for(const line of text.split(/\r?\n/)){if(!line)continue;try{const r=JSON.parse(line);if(r.recipeId)map.set(String(r.recipeId),r);}catch{}}return map;}catch(e){if(e.code==='ENOENT')return new Map();throw e;}}
async function download(url){const r=await fetch(url,{headers:{'User-Agent':'MYPA exact-dataset mirror',Accept:'image/avif,image/webp,image/apng,image/*,*/*;q=0.7'}});if(!r.ok)throw new Error(`image ${r.status}`);return Buffer.from(await r.arrayBuffer());}
async function main(){await fs.mkdir(IMAGE_ROOT,{recursive:true});await fs.mkdir(MANIFEST_DIR,{recursive:true});const [heroRows,names,manifest]=await Promise.all([allHeroes(),recipes(),loadManifest()]);let mirrored=0,skipped=0,failed=0;for(const row of heroRows){const id=String(row.recipe_id);if(!names.has(id))continue;const target=path.join(IMAGE_ROOT,id,'hero.webp');if(manifest.get(id)?.status==='complete'&&manifest.get(id)?.resolver==='exact-dataset'&&exists(target)){skipped++;continue;}try{const bytes=await download(row.image_url);const meta=await sharp(bytes,{failOn:'none'}).rotate().metadata();if(Math.min(meta.width||0,meta.height||0)<MIN_SIDE)throw new Error('source resolution too small');const out=await sharp(bytes,{failOn:'none'}).rotate().resize({width:1200,fit:'inside',withoutEnlargement:true}).webp({quality:90,effort:6}).toBuffer();if(out.length<MIN_BYTES||out.length>MAX_BYTES)throw new Error(`encoded size ${out.length} outside bounds`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,out);const manifestRow={recipeId:id,recipeName:names.get(id),status:'complete',resolver:'exact-dataset',sourceType:DATASET_SOURCE,sourcePageUrl:row.source_url||null,sourceImageUrl:row.image_url,sourceWidth:Number(meta.width||0),sourceHeight:Number(meta.height||0),width:Math.round((await sharp(out).metadata()).width||0),height:Math.round((await sharp(out).metadata()).height||0),bytes:out.length,localPath:path.relative(ROOT,target),generatedAt:now()};await fs.appendFile(MANIFEST_PATH,`${JSON.stringify(manifestRow)}\n`);mirrored++;}catch(e){failed++;await fs.appendFile(MANIFEST_PATH,`${JSON.stringify({recipeId:id,recipeName:names.get(id),status:'failed',reason:`exact-dataset-mirror: ${e instanceof Error?e.message:String(e)}`,failedAt:now()})}\n`);}}
console.log(JSON.stringify({status:failed?'partial':'complete',datasetHeroes:heroRows.length,mirrored,skipped,failed},null,2));if(failed)process.exitCode=2;}
main().catch(e=>{console.error(e);process.exit(1);});
