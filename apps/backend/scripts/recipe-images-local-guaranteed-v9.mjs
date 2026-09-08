import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes.jsonl');
const FAILURE = path.join(ROOT, 'manifest', 'failures.jsonl');
const CACHE_FILE = path.join(ROOT, 'manifest', 'recipe-discovery-cache.json');
const DATASET_DIR = path.join(ROOT, 'dataset', 'epicurious-image-dataset');
const MAX_IMAGES = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_MAX_IMAGES || '4'), 1), 4);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '4'), 1), 8);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '650'), 0);
const SEARCH_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_LOCAL_SEARCH_TIMEOUT_MS || '12000'), 5000);
const PAGE_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_LOCAL_PAGE_TIMEOUT_MS || '12000'), 5000);
const IMAGE_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_LOCAL_IMAGE_TIMEOUT_MS || '15000'), 5000);
const MIN_SIDE = 640;
const MIN_BYTES = 20 * 1024;
const MAX_BYTES = 150 * 1024;
const UA = 'MYPA-recipe-engine/9.0';
const BAD_HOSTS = new Set(['facebook.com','instagram.com','pinterest.com','youtube.com','wikipedia.org','linkedin.com','duckspecies.org','pa.gov','eset.com','britishairways.com']);
const SOURCE_DOMAINS = ['epicurious.com','bonappetit.com','foodandwine.com','seriouseats.com','allrecipes.com','bbcgoodfood.com','tasteofhome.com','simplyrecipes.com','thekitchn.com','delish.com','eatingwell.com','cooking.nytimes.com','foodnetwork.com','recipetineats.com','loveandlemons.com','onceuponachef.com'];
const SEARCH_PROVIDERS = [
  (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
  (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  (q) => `https://search.yahoo.com/search?p=${encodeURIComponent(q)}`,
  (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
];

const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); } catch { return ''; } };
const badHost = (u) => { const h = host(u); return !h || BAD_HOSTS.has(h) || [...BAD_HOSTS].some((d) => h.endsWith(`.${d}`)); };
const normalizeUrl = (v, base) => { try { const u = new URL(String(v).replaceAll('&amp;','&').replaceAll('\\/','/'), base); return /^https?:$/i.test(u.protocol) ? u.toString() : null; } catch { return null; } };
const normalize = (v) => String(v || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[“”‘’]/g,"'").replace(/\b(recipe|recipes|food|dish|easy|best|favorite|favourite|classic|homemade|simple)\b/g,' ').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const tokens = (v) => [...new Set(normalize(v).split(' ').filter((x) => x.length > 2))];
function titleScore(a,b) { const x=normalize(a), y=normalize(b); if(!x||!y)return 0; if(x===y)return 1; const A=tokens(x), B=new Set(tokens(y)); const hits=A.filter((t)=>B.has(t)).length; const coverage=A.length?hits/A.length:0; const j=A.length||B.size?hits/(A.length+B.size-hits):0; const contain=x.includes(y)||y.includes(x); return Math.max(coverage*0.8+j*0.2, contain?0.97:0); }
function datasetScore(recipeTitle, datasetTitle, imageName='') { const s1=titleScore(recipeTitle,datasetTitle); const stem=String(imageName).replace(/\.[^.]+$/,'').replace(/\d{4,}$/,''); return Math.max(s1,titleScore(recipeTitle,stem)*0.96); }

async function readJson(file, fallback) { try { return JSON.parse(await fs.readFile(file,'utf8')); } catch(e) { if(e.code==='ENOENT') return fallback; throw e; } }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file,JSON.stringify(value,null,2)); }
async function append(file,row) { await fs.mkdir(path.dirname(file),{recursive:true}); await fs.appendFile(file,JSON.stringify(row)+'\n'); }
async function loadJsonl(file) { try{return (await fs.readFile(file,'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse);}catch(e){if(e.code==='ENOENT')return [];throw e;} }
async function loadCatalog() { if(!exists(CATALOG))throw new Error(`Catalog not found: ${CATALOG}`); return (await fs.readFile(CATALOG,'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse).map((r)=>({recipeId:String(r.recipeId||r.id||''),name:String(r.name||r.recipeName||'')})).filter((r)=>r.recipeId&&r.name); }

async function httpText(url, timeout=PAGE_TIMEOUT_MS) { const c=new AbortController(); const t=setTimeout(()=>c.abort(),timeout); try { const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'User-Agent':UA,Accept:'text/html,application/xhtml+xml,*/*;q=.8','Accept-Language':'en-US,en;q=.8'}}); const html=await r.text(); return {ok:r.ok,status:r.status,html,finalUrl:r.url||url}; } finally { clearTimeout(t); } }
async function httpImage(url) { const c=new AbortController(); const t=setTimeout(()=>c.abort(),IMAGE_TIMEOUT_MS); try { const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'User-Agent':UA,Accept:'image/avif,image/webp,image/apng,image/*,*/*;q=.7'}}); if(!r.ok)throw new Error(`image ${r.status}`); return Buffer.from(await r.arrayBuffer()); } finally { clearTimeout(t); } }

function jsonLd(html) { const out=[]; for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const j=JSON.parse(m[1].trim()); const walk=(n)=>{if(!n)return;if(Array.isArray(n)){n.forEach(walk);return;}if(typeof n!=='object')return;out.push(n);if(n['@graph'])walk(n['@graph']);};walk(j);}catch{}} return out; }
function pageInfo(html) { const titles=[]; const t=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]; if(t)titles.push(t); for(const m of html.matchAll(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/gi))titles.push(m[1]); for(const n of jsonLd(html)){if(n.name)titles.push(String(n.name));if(n.headline)titles.push(String(n.headline));} return [...new Set(titles.map((x)=>String(x).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean))]; }
function recipeNode(html, recipeName) { let best=null; for(const n of jsonLd(html)){const types=Array.isArray(n['@type'])?n['@type']:[n['@type']]; if(!types.some((t)=>String(t).toLowerCase()==='recipe'))continue; const s=titleScore(recipeName,n.name); if(s>=0.90 && (!best||s>best.score))best={node:n,score:s};} return best; }
function pageImages(html, base, recipeName) { const out=[]; const add=(v,rank,extractor)=>{const u=normalizeUrl(v,base);if(!u||badHost(u))return; const l=u.toLowerCase(); if(/sprite|logo|icon|avatar|favicon|pixel|tracking|placeholder|banner/i.test(l))return; out.push({url:u,rank,extractor});}; const rn=recipeNode(html,recipeName); if(rn?.node?.image){for(const x of (Array.isArray(rn.node.image)?rn.node.image:[rn.node.image]))add(typeof x==='string'?x:x?.url,0,'jsonld-recipe');}
 for(const re of [/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi,/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi])for(const m of html.matchAll(re))add(m[1],5,'meta');
 for(const m of html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi))add(m[1],20,'img');
 for(const m of html.matchAll(/srcset=["']([^"']+)["']/gi))for(const p of m[1].split(','))add(p.trim().split(/\s+/)[0],18,'srcset');
 const uniq=new Map();for(const x of out){const p=uniq.get(x.url);if(!p||x.rank<p.rank)uniq.set(x.url,x);}return [...uniq.values()].sort((a,b)=>a.rank-b.rank).slice(0,20); }
function searchLinks(html) { const out=[]; for(const m of html.matchAll(/href=["']([^"']+)["']/gi)){const u=normalizeUrl(m[1]);if(!u||badHost(u)||/google\.|bing\.com$|duckduckgo\.com$|yahoo\.com$/i.test(host(u)))continue;out.push(u);} return [...new Set(out)]; }
function sourcePriority(u){const h=host(u);const i=SOURCE_DOMAINS.findIndex((d)=>h===d||h.endsWith(`.${d}`));return i<0?50:i;}

async function packImage(body){ const meta=await sharp(body,{failOn:'none'}).rotate().metadata(); const sw=Number(meta.width||0),sh=Number(meta.height||0); if(Math.min(sw,sh)<MIN_SIDE)throw new Error(`source ${sw}x${sh} below 640`); let best=null; for(const w of [1400,1200,1080,960,880,800,720,640])for(const q of [90,84,78,72,66,60,54,48,42,36,30,24,18,12,8,4]){const out=await sharp(body,{failOn:'none'}).rotate().resize({width:w,fit:'inside',withoutEnlargement:true}).webp({quality:q,effort:6}).toBuffer();const m=await sharp(out).metadata();const r={output:out,width:Number(m.width||w),height:Number(m.height||0),bytes:out.length,quality:q};if(!best||Math.abs(r.bytes-100*1024)<Math.abs(best.bytes-100*1024))best=r;if(r.width>=MIN_SIDE&&r.height>=MIN_SIDE&&r.bytes>=MIN_BYTES&&r.bytes<=MAX_BYTES)return r;} if(best&&best.width>=MIN_SIDE&&best.height>=MIN_SIDE&&best.bytes<=MAX_BYTES)return best;throw new Error(`cannot encode acceptable image; smallest=${best?.bytes??'none'}`); }

async function ensureDataset() { if(process.env.RECIPE_LOCAL_SKIP_DATASET==='1')return null; const candidates=[path.join(DATASET_DIR,'Fridge2Fork-main'),path.join(DATASET_DIR,'Food Images')]; if(candidates.some(exists))return DATASET_DIR; const zip=path.join(DATASET_DIR,'github-mirror.zip'); await fs.mkdir(DATASET_DIR,{recursive:true}); if(!exists(zip)){const sources=[process.env.RECIPE_LOCAL_DATASET_URL||'https://www.kaggle.com/api/v1/datasets/download/pes12017000148/food-ingredients-and-recipe-dataset-with-images','https://github.com/kaveesh-kadirvel/Fridge2Fork/archive/refs/heads/main.zip'];for(const url of sources){try{console.log(JSON.stringify({datasetSource:url,action:'download'}));const child=spawn('curl',['-L','--fail','--retry','2','--connect-timeout','20','--max-time','1800','-o',zip,url],{stdio:'inherit'});const code=await new Promise((res)=>child.on('exit',(c)=>res(c??1)));if(code===0)break;if(exists(zip)){await fs.unlink(zip).catch(()=>{});}}catch{}}} if(exists(zip)){const child=spawn('unzip',['-q','-o',zip,'-d',DATASET_DIR],{stdio:'inherit'});const code=await new Promise((res)=>child.on('exit',(c)=>res(c??1)));if(code!==0)throw new Error('dataset extraction failed');} return exists(DATASET_DIR)?DATASET_DIR:null; }
async function datasetFiles(root){ if(!root)return null; let csv=null; const images=[]; const stack=[root]; while(stack.length){const d=stack.pop();for(const n of await fs.readdir(d)){const f=path.join(d,n);const s=await fs.stat(f);if(s.isDirectory())stack.push(f);else if(/^Food Ingredients and Recipe Dataset with Image Name Mapping\.csv$/i.test(n))csv=f;else if(/\.(?:jpe?g|png|webp|avif)$/i.test(n))images.push({name:n,file:f});}} return csv?{csv,images}:null; }
function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;}else if(c==='"')q=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';}else if(c!=='\r')cell+=c;}row.push(cell);if(row.some(Boolean))rows.push(row);return rows;}
async function buildDatasetIndex(files){if(!files)return new Map();const rows=parseCsv(await fs.readFile(files.csv,'utf8'));const h=rows[0].map((x)=>normalize(x).replace(/ /g,'_'));const ti=h.findIndex((x)=>x==='title'), ii=h.findIndex((x)=>x==='image_name');if(ti<0||ii<0)return new Map();const byImage=new Map(files.images.map((x)=>[x.name.toLowerCase(),x.file]));const index=new Map();for(let i=1;i<rows.length;i++){const t=String(rows[i][ti]||'').trim(),img=String(rows[i][ii]||'').trim();if(!t||!img)continue;const file=byImage.get(img.toLowerCase())||byImage.get(img.replace(/\.[^.]+$/,'').toLowerCase());if(!file)continue;const k=normalize(t);const list=index.get(k)||[];list.push({title:t,imageName:img,file});index.set(k,list);}return index;}

async function verifyAndSave(recipe,pageUrl,cacheSource){ const page=await httpText(pageUrl); if(!page.ok)throw new Error(`page ${page.status}`); const info=pageInfo(page.html); const best=Math.max(...info.map((x)=>titleScore(recipe.name,x)),0); const rn=recipeNode(page.html,recipe.name); if(best<0.78 || !rn)throw new Error('page is not a verified Recipe for requested title'); const candidates=pageImages(page.html,page.finalUrl,recipe.name); if(!candidates.length)throw new Error('verified recipe page has no image candidates'); const images=[]; const hashes=new Set(); for(const c of candidates){try{const body=await httpImage(c.url);const packed=await packImage(body);const hash=crypto.createHash('sha256').update(packed.output).digest('hex');if(hashes.has(hash))continue;hashes.add(hash);images.push({packed,sourceImageUrl:c.url,extractor:c.extractor,hash});if(images.length>=MAX_IMAGES)break;}catch{}} if(!images.length)throw new Error('recipe page images failed validation'); const dir=path.join(IMAGE_ROOT,recipe.recipeId,'gallery');await fs.mkdir(dir,{recursive:true});const saved=[];for(let i=0;i<images.length;i++){const x=images[i],file=path.join(dir,`${String(i+1).padStart(2,'0')}.webp`);await fs.writeFile(file,x.packed.output);saved.push({index:i+1,localPath:path.relative(ROOT,file),sourceImageUrl:x.sourceImageUrl,extractor:x.extractor,width:x.packed.width,height:x.packed.height,bytes:x.packed.bytes,quality:x.packed.quality,sha256:x.hash});}const hero=path.join(IMAGE_ROOT,recipe.recipeId,'hero.webp');await fs.copyFile(path.join(ROOT,saved[0].localPath),hero);const row={recipeId:recipe.recipeId,recipeName:recipe.name,status:'complete',resolver:'recipe-engine-v9',sourcePageUrl:page.finalUrl,sourceType:host(page.finalUrl),matchedPageTitle:info.sort((a,b)=>titleScore(recipe.name,b)-titleScore(recipe.name,a))[0],matchScore:best,recipeJsonLdScore:rn.score,imageCount:saved.length,maxImages:MAX_IMAGES,images:saved,localPath:path.relative(ROOT,hero),galleryCount:saved.length,cacheSource,generatedAt:now()};await append(MANIFEST,row);return row; }

async function directCandidates(name){const slug=normalize(name).replace(/ /g,'-');const out=[];for(const d of SOURCE_DOMAINS){if(d==='epicurious.com')out.push(`https://www.epicurious.com/recipes/food/views/${slug}`);if(d==='bonappetit.com')out.push(`https://www.bonappetit.com/recipe/${slug}`);if(d==='foodandwine.com')out.push(`https://www.foodandwine.com/recipes/${slug}`);if(d==='bbcgoodfood.com')out.push(`https://www.bbcgoodfood.com/recipes/${slug}`);if(d==='tasteofhome.com')out.push(`https://www.tasteofhome.com/recipes/${slug}`);if(d==='thekitchn.com')out.push(`https://www.thekitchn.com/${slug}`);}return out;}

async function discover(recipe,cache){const key=normalize(recipe.name);if(cache[key]?.urls?.length)return cache[key].urls;const found=[];for(const u of await directCandidates(recipe.name)){try{const r=await httpText(u);if(r.ok&&Math.max(...pageInfo(r.html).map((x)=>titleScore(recipe.name,x)),0)>=0.78&&recipeNode(r.html,recipe.name))found.push(r.finalUrl);}catch{}}
 const providers=SEARCH_PROVIDERS;
 for(const provider of providers){
  const q=`"${recipe.name.replace(/"/g,'')}" recipe`;
  try{const r=await httpText(provider(q),SEARCH_TIMEOUT_MS);if(!r.ok||r.status===429)continue;const links=searchLinks(r.html).sort((a,b)=>sourcePriority(a)-sourcePriority(b));for(const u of links.slice(0,30)){if(found.length>=10)break;if(!SOURCE_DOMAINS.some((d)=>host(u)===d||host(u).endsWith(`.${d}`)))continue;found.push(u);}}
  catch{}
  if(found.length>=10)break;
 }
 const unique=[...new Set(found)]; cache[key]={urls:unique,updatedAt:now()}; return unique;
}

async function loadLatest(){const rows=await loadJsonl(MANIFEST);const m=new Map();for(const r of rows)if(r.recipeId)m.set(String(r.recipeId),r);return m;}

async function main(){
 console.log(JSON.stringify({pipeline:'recipe-images-local-guaranteed-v9',supabase:'DISABLED',target:'1-4 verified images per recipe',strategy:['local verified cache','high-confidence dataset identity matching','direct recipe-page candidates','multi-provider web-page discovery','Recipe JSON-LD verification','1-4 image extraction','local evidence manifest','resumable failure queue']},null,2));
 const catalog=await loadCatalog(); const cache=await readJson(CACHE_FILE,{}); const latest=await loadLatest(); const datasetRoot=await ensureDataset(); const files=await datasetFiles(datasetRoot); const dindex=await buildDatasetIndex(files);
 console.log(JSON.stringify({catalogRecipes:catalog.length,localDataset:files?{csv:files.csv,images:files.images.length,indexKeys:dindex.size}:null},null,2));
 let cursor=0,done=0,failed=0,skipped=0,datasetMatched=0,webMatched=0;
 const worker=async()=>{while(true){const i=cursor++;if(i>=catalog.length)return;const recipe=catalog[i];const prior=latest.get(recipe.recipeId);if(prior?.status==='complete'&&prior.localPath&&exists(path.resolve(ROOT,prior.localPath))){skipped++;continue;}let row=null;
  try{
   const candidates=dindex.get(normalize(recipe.name))||[];let best=null,second=0;for(const c of candidates){const s=datasetScore(recipe.name,c.title,c.imageName);if(!best||s>best.score){second=best?.score||0;best={...c,score:s};}else if(s>second)second=s;}
   if(best&&best.score>=0.96&&(best.score-second>=0.04||candidates.length===1)){
    const packed=await packImage(await fs.readFile(best.file));const dir=path.join(IMAGE_ROOT,recipe.recipeId,'gallery');await fs.mkdir(dir,{recursive:true});const file=path.join(dir,'01.webp');await fs.writeFile(file,packed.output);const hero=path.join(IMAGE_ROOT,recipe.recipeId,'hero.webp');await fs.copyFile(file,hero);row={recipeId:recipe.recipeId,recipeName:recipe.name,status:'complete',resolver:'recipe-engine-v9-dataset',sourceType:'epicurious-dataset',matchedDatasetTitle:best.title,datasetImageName:best.imageName,matchScore:best.score,width:packed.width,height:packed.height,bytes:packed.bytes,quality:packed.quality,localPath:path.relative(ROOT,hero),galleryCount:1,generatedAt:now()};await append(MANIFEST,row);datasetMatched++;done++;console.log(`[DATASET ${done}] ${recipe.name}`);continue;
   }
   const urls=await discover(recipe,cache);for(const u of urls.sort((a,b)=>sourcePriority(a)-sourcePriority(b))){try{row=await verifyAndSave(recipe,u,'v9-discovery');webMatched++;break;}catch{}}
   if(!row){failed++;await append(FAILURE,{recipeId:recipe.recipeId,recipeName:recipe.name,status:'failed',reason:urls.length?'all discovered recipe pages failed verification/image validation':'no verified source page discovered',generatedAt:now()});console.error(`[FAILED] ${recipe.name}`);}else{done++;console.log(`[COMPLETE ${done}] ${recipe.name} -> ${row.imageCount} image(s) [${row.sourceType}]`);}
  }catch(error){failed++;await append(FAILURE,{recipeId:recipe.recipeId,recipeName:recipe.name,status:'failed',reason:error instanceof Error?error.message:String(error),generatedAt:now()});console.error(`[FAILED] ${recipe.name}: ${error instanceof Error?error.message:String(error)}`);}
  await writeJson(CACHE_FILE,cache); await sleep(DELAY_MS);
 }};
 await Promise.all(Array.from({length:CONCURRENCY},worker)); await writeJson(CACHE_FILE,cache);console.log(JSON.stringify({status:failed?'incomplete':'complete',catalogRecipes:catalog.length,completed:done,failed,skipped,datasetMatched,webMatched},null,2));if(failed)process.exitCode=1;
}
main().catch((e)=>{console.error(`ENGINE FAILED: ${e instanceof Error?e.message:String(e)}`);process.exit(1);});
