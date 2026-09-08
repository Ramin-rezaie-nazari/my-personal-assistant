import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const MANIFEST_PATH = path.join(ROOT, 'manifest', 'recipe-heroes.jsonl');
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const BATCH = 100;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers={apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`};
const exists=(p)=>{try{fsSync.accessSync(p);return true;}catch{return false;}};
async function rest(pathname,options={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`,{...options,headers:{...headers,'Content-Type':'application/json',...(options.headers||{})}});const text=await r.text();if(!r.ok)throw new Error(`${r.status} ${pathname}: ${text}`);return text?JSON.parse(text):null;}
async function upload(key,body){const encoded=key.split('/').map(encodeURIComponent).join('/');const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`,{method:'POST',headers:{...headers,'Content-Type':'image/webp','Cache-Control':'31536000','x-upsert':'true'},body});const text=await r.text();if(!r.ok)throw new Error(`storage ${r.status}: ${text}`);}
async function main(){if(!exists(MANIFEST_PATH))throw new Error(`Manifest not found: ${MANIFEST_PATH}`);const text=await fs.readFile(MANIFEST_PATH,'utf8');const latest=new Map();for(const line of text.split(/\r?\n/)){if(!line)continue;try{const r=JSON.parse(line);if(r.recipeId)latest.set(String(r.recipeId),r);}catch{}}const rows=[...latest.values()].filter(r=>r.status==='complete'&&r.localPath&&exists(path.resolve(ROOT,r.localPath)));let published=0,failed=0;for(let i=0;i<rows.length;i+=BATCH){const batch=rows.slice(i,i+BATCH);for(const row of batch){try{const body=await fs.readFile(path.resolve(ROOT,row.localPath));const key=`recipes/${row.recipeId}/hero.webp`;await upload(key,body);const imageUrl=`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;await rest('recipe_images',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({recipe_id:row.recipeId,image_type:'hero',step_number:null,image_url:imageUrl,width:row.width,height:row.height,byte_size:body.length,mime_type:'image/webp',alt_text:`${row.recipeName} hero image`,sort_order:0,storage_key:key,source_name:row.sourceType||row.resolver||'verified recipe image',source_url:row.sourcePageUrl||row.sourceImageUrl||null,source_license:null,source_attribution:`Verified local recipe-image pipeline; resolver=${row.resolver||'unknown'}; matchScore=${row.matchScore??'n/a'}; matchCoverage=${row.matchCoverage??'n/a'}.`})});published++;}catch(e){failed++;console.error(`[PUBLISH FAILED] ${row.recipeId} ${row.recipeName}: ${e instanceof Error?e.message:String(e)}`);}}console.log(JSON.stringify({progress:Math.min(i+BATCH,rows.length),total:rows.length,published,failed}));}console.log(JSON.stringify({status:failed?'partial':'complete',candidateRows:rows.length,published,failed},null,2));if(failed)process.exitCode=2;}
main().catch(e=>{console.error(e);process.exit(1);});
