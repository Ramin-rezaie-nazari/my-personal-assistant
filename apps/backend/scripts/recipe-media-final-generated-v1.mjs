#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'recipe-final-manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'recipe-final-summary.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const IMAGE_DATASET_SLUG = 'pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const IMAGE_DATASET_URL = 'https://www.kaggle.com/datasets/pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const MAX_BYTES = 64 * 1024;
const CONCURRENCY = Math.min(16, Math.max(1, Number(process.env.RECIPE_FINAL_CONCURRENCY ?? 12)));
const MAX_ITEMS = Number.isFinite(Number(process.env.RECIPE_FINAL_MAX)) && Number(process.env.RECIPE_FINAL_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_FINAL_MAX)) : null;
const UA = 'MYPA-recipe-real-media/2.0';

const clean = (v='') => String(v)
  .replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;/gi,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'")
  .replace(/\s+/g,' ')
  .trim();
const normalize = (v='') => clean(v)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .replace(/&/g,' and ')
  .replace(/[^a-z0-9]+/g,' ')
  .trim()
  .replace(/\s+/g,' ');
const slug = (v) => normalize(v).replace(/\s+/g,'-') || createHash('sha1').update(clean(v)).digest('hex').slice(0,12);
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function saveJson(file,value){
  await mkdir(path.dirname(file),{recursive:true});
  const tmp=`${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await writeFile(tmp,JSON.stringify(value,null,2)+'\n','utf8');
  await rename(tmp,file);
}

async function fetchJson(url, attempts=5){
  let last;
  for(let i=0;i<attempts;i+=1){
    try{
      const r=await fetch(url,{headers:{'User-Agent':UA,Accept:'application/json'}});
      if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.json();
    }catch(e){ last=e; if(i<attempts-1) await sleep(700*2**i); }
  }
  throw last;
}

function parseCsvLine(line){
  const out=[]; let cur=''; let quoted=false;
  for(let i=0;i<line.length;i+=1){
    const c=line[i];
    if(c==='"'){
      if(quoted && line[i+1]==='"'){cur+='"';i+=1;}
      else quoted=!quoted;
    } else if(c===',' && !quoted){out.push(cur);cur='';}
    else cur+=c;
  }
  out.push(cur); return out;
}

function findFiles(root, predicate){
  const out=[]; const stack=[root];
  while(stack.length){
    const dir=stack.pop();
    for(const name of readdirSync(dir)){
      const full=path.join(dir,name); const s=statSync(full);
      if(s.isDirectory()) stack.push(full);
      else if(predicate(full,name)) out.push(full);
    }
  }
  return out;
}

function datasetRoot(){
  const configured=process.env.RECIPE_IMAGE_DATASET_DIR ? path.resolve(process.env.RECIPE_IMAGE_DATASET_DIR) : null;
  for(const p of [configured, path.join(process.cwd(),'recipe-image-dataset'), path.join(process.cwd(),'archive'), path.join(process.cwd(),'Food Images')]){
    if(p && existsSync(p)) return p;
  }
  try{
    const has=execFileSync('python3',['-c',"import importlib.util; print(bool(importlib.util.find_spec('kagglehub')))"] ,{encoding:'utf8'}).trim()==='True';
    if(!has) execFileSync('python3',['-m','pip','install','--user','kagglehub'],{stdio:'inherit'});
    const out=execFileSync('python3',['-c',`import kagglehub; print(kagglehub.dataset_download('${IMAGE_DATASET_SLUG}'))`],{encoding:'utf8',stdio:['ignore','pipe','inherit']}).trim();
    const p=out.split('\n').pop(); if(p && existsSync(p)) return p;
  }catch(e){ throw new Error(`Kaggle image dataset download failed. Set RECIPE_IMAGE_DATASET_DIR manually. ${e instanceof Error?e.message:String(e)}`); }
  throw new Error(`Recipe image dataset unavailable: ${IMAGE_DATASET_URL}`);
}

function buildImageCatalog(root){
  const exts=new Set(['.jpg','.jpeg','.png','.webp']);
  const byFile=new Map(); const byStem=new Map();
  for(const file of findFiles(root,(_,name)=>exts.has(path.extname(name).toLowerCase()))){
    const name=path.basename(file); const stem=name.slice(0,-path.extname(name).length);
    byFile.set(normalize(name),file);
    byStem.set(normalize(stem),file);
  }
  return {byFile,byStem,count:byStem.size};
}

function buildTitleImageIndex(root){
  const csvFiles=findFiles(root,(_,name)=>/\.csv$/i.test(name));
  const titleToImage=new Map();
  for(const file of csvFiles){
    let text='';
    try{text=readFile(file,'utf8');}catch{continue;}
    const lines=text.split(/\r?\n/).filter(Boolean);
    if(!lines.length) continue;
    const header=parseCsvLine(lines[0]).map((x)=>normalize(x));
    const titleIndex=header.findIndex((x)=>x==='title' || x==='recipe title' || x==='name');
    const imageIndex=header.findIndex((x)=>x==='image name' || x==='imagename' || x==='image_name');
    if(titleIndex<0 || imageIndex<0) continue;
    for(let i=1;i<lines.length;i+=1){
      const row=parseCsvLine(lines[i]);
      const title=normalize(row[titleIndex]??''); const image=clean(row[imageIndex]??'');
      if(title && image && image!=='#NAME?') titleToImage.set(title,image);
    }
  }
  return titleToImage;
}

function parseRecipe(row,index){
  const d=row?.recipe_data??row??{}; const lines=Array.isArray(d.text_lines)?d.text_lines:[];
  const title=clean(d.title??row.title??row.filename?.split('/').pop()?.replace(/\.html$/i,'')??`Recipe ${index+1}`);
  const directImage=clean(d.image_name??d.imageName??row.image_name??row.imageName??'');
  return { index, title, sourceUrl:d.url??null, directImage };
}

function resolveImage(item,catalog,titleIndex){
  const candidates=[];
  if(item.directImage) candidates.push(item.directImage);
  const fromTitle=titleIndex.get(normalize(item.title)); if(fromTitle) candidates.push(fromTitle);
  for(const candidate of candidates){
    if(candidate==='#NAME?' || !candidate) continue;
    const norm=normalize(candidate);
    const exact=catalog.byFile.get(norm) || catalog.byStem.get(norm) || catalog.byStem.get(normalize(path.basename(candidate)));
    if(exact) return {file:exact,imageName:path.basename(exact),match:'exact-image-name-or-title',source:'Food Ingredients and Recipes Dataset with Images'};
  }
  return null;
}

async function encodeWebp(source){
  for(const width of [1200,1080,960,880,800,720,640,576,512,448,384,320]){
    for(const quality of [82,76,70,64,58,52,46,40,34,28]){
      const out=await sharp(source,{failOn:'none'}).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality,effort:6}).toBuffer();
      if(out.byteLength<=MAX_BYTES){
        const meta=await sharp(out).metadata();
        return {out,width:meta.width??width,height:meta.height??width};
      }
    }
  }
  throw new Error('No WebP variant <= 64KB');
}

async function main(){
  await mkdir(MEDIA_ROOT,{recursive:true});
  const dataset=await fetchJson(DATASET_URL); if(!Array.isArray(dataset)) throw new Error('Recipe dataset invalid');
  const rows=MAX_ITEMS?dataset.slice(0,MAX_ITEMS):dataset;
  const imageRoot=datasetRoot();
  const catalog=buildImageCatalog(imageRoot); const titleIndex=buildTitleImageIndex(imageRoot);
  const manifest={schemaVersion:11,generatedAt:new Date().toISOString(),root:ROOT,requiredMediaPerRecipe:1,mediaPolicy:'one-real-finished-dish-image',items:{}};
  let cursor=0;
  async function worker(){
    while(true){
      const i=cursor++; if(i>=rows.length) return;
      const item=parseRecipe(rows[i],i);
      const key=`recipe:${item.index}:${slug(item.title)}`;
      const directory=path.join(MEDIA_ROOT,`${slug(item.title)}-${item.index}`);
      await mkdir(directory,{recursive:true});
      try{
        const resolved=resolveImage(item,catalog,titleIndex);
        if(!resolved) throw new Error(`No real finished-dish dataset image mapped for recipe: ${item.title}`);
        const encoded=await encodeWebp(await readFile(resolved.file)); const digest=sha256(encoded.out);
        const file=path.join(directory,`final-${digest.slice(0,12)}.webp`); await writeFile(file,encoded.out);
        manifest.items[key]={kind:'recipe',index:item.index,name:item.title,slug:slug(item.title),sourceUrl:item.sourceUrl,stage:'final',status:'ready',mediaCount:1,format:'webp',sizeBytes:encoded.out.length,width:encoded.width,height:encoded.height,sha256:digest,localPath:path.relative(ROOT,file).split(path.sep).join('/'),objectKey:path.relative(MEDIA_ROOT,file).split(path.sep).join('/'),provider:resolved.source,license:'CC BY-SA 3.0',attribution:`${resolved.source}; exact ${resolved.match}; transformed only by resize/recompression to WebP <= 64KB.`,sourceType:'real-dataset-image',generated:false,basedOnRecipe:true,imageName:resolved.imageName};
      }catch(error){
        manifest.items[key]={kind:'recipe',index:item.index,name:item.title,slug:slug(item.title),sourceUrl:item.sourceUrl,status:'failed',mediaCount:0,error:error instanceof Error?error.message:String(error)};
      }
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY},worker));
  await saveJson(MANIFEST_PATH,manifest);
  const items=Object.values(manifest.items);
  const complete=items.filter(x=>x.status==='ready'&&x.mediaCount===1&&x.format==='webp'&&x.sizeBytes>0&&x.sizeBytes<=MAX_BYTES&&x.generated===false&&x.stage==='final').length;
  const failed=items.filter(x=>x.status==='failed').length;
  const summary={schemaVersion:11,generatedAt:manifest.generatedAt,root:ROOT,requiredMediaPerRecipe:1,mediaPolicy:'one-real-finished-dish-image',datasetRows:rows.length,recipes:items.length,complete,incomplete:items.length-complete,failed,realImages:complete,generatedImages:items.filter(x=>x.generated===true).length,maxBytes:MAX_BYTES,sourceDataset:IMAGE_DATASET_URL,imageDatasetFiles:catalog.count,titleMappings:titleIndex.size,corpusComplete:rows.length>0&&items.length===rows.length&&complete===rows.length};
  await saveJson(SUMMARY_PATH,summary); console.log(JSON.stringify(summary,null,2)); if(!summary.corpusComplete) process.exitCode=2;
}
main().catch((e)=>{console.error(e);process.exitCode=1});
