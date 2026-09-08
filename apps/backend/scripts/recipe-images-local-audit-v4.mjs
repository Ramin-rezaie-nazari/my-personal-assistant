import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST_DIR = path.join(ROOT, 'manifest');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-heroes.jsonl');
const CATALOG = path.resolve(process.env.RECIPE_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const PAGE_TIMEOUT_MS = 10000;
const MIN_MATCH = 0.72;
const MIN_COVERAGE = 0.82;

const BAD_HOSTS = new Set(['facebook.com','instagram.com','pinterest.com','youtube.com','wikipedia.org','linkedin.com','trustpilot.com','freedictionary.com','duckspecies.org','pa.gov','eset.com','britishairways.com']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const clean = (v='') => String(v).replace(/<[^>]+>/g,' ').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&apos;/gi,"'").replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const norm = (v='') => clean(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[“”‘’]/g,"'").replace(/\b(recipe|recipes|food|dish|easy|best|favorite|favourite|classic|homemade|simple)\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const score = (a,b) => { const x=norm(a), y=norm(b); if(!x||!y)return {similarity:0,coverage:0,exact:false}; if(x===y||x.includes(y)||y.includes(x))return {similarity:1,coverage:1,exact:true}; const A=new Set(x.split(' ').filter(t=>t.length>2)), B=new Set(y.split(' ').filter(t=>t.length>2)); let hit=0; for(const t of A)if(B.has(t))hit++; return {similarity:hit/Math.max(A.size,B.size),coverage:hit/(A.size||1),exact:false}; };
const matches = (recipe, values) => { let best={similarity:0,coverage:0,exact:false,text:''}; for(const value of values||[]){const s=score(recipe,value);if(s.exact||s.similarity>best.similarity||s.coverage>best.coverage)best={...s,text:value};} return best.exact||(best.similarity>=MIN_MATCH&&best.coverage>=MIN_COVERAGE)?best:null; };
const host = (url) => { try{return new URL(url).hostname.replace(/^www\./,'').toLowerCase();}catch{return '';} };
const badHost = (url) => { const h=host(url); return !h || BAD_HOSTS.has(h) || [...BAD_HOSTS].some((d)=>h.endsWith(`.${d}`)); };
async function fetchText(url){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),PAGE_TIMEOUT_MS); try{const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'User-Agent':'MYPA-recipe-media-local/audit-v4','Accept':'text/html,application/xhtml+xml,*/*;q=0.8','Accept-Language':'en-US,en;q=0.9'}}); const html=await r.text(); if(!r.ok||html.length<500)throw new Error(`${r.status||'empty'}`); return {html,finalUrl:r.url||url};}finally{clearTimeout(t);} }
function titles(html){const out=[]; const t=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]; if(t)out.push(clean(t)); for(const re of [/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/gi,/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["'][^>]*>/gi])for(const m of html.matchAll(re))out.push(clean(m[1])); for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const j=JSON.parse(m[1]);const visit=(n)=>{if(!n)return;if(Array.isArray(n)){n.forEach(visit);return;}if(typeof n!=='object')return;if(n.name)out.push(clean(n.name));if(n.headline)out.push(clean(n.headline));if(n['@graph'])visit(n['@graph']);};visit(j);}catch{}} return [...new Set(out.filter(Boolean))];}
async function loadLines(file){try{return (await fs.readFile(file,'utf8')).split(/\r?\n/).filter(Boolean).map((x)=>JSON.parse(x));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
async function main(){await fs.mkdir(MANIFEST_DIR,{recursive:true});const catalog=(await fs.readFile(CATALOG,'utf8')).split(/\r?\n/).filter(Boolean).map((x)=>JSON.parse(x)).map(r=>({id:String(r.recipeId||r.id||''),name:String(r.name||r.recipeName||'')})).filter(r=>r.id&&r.name);const names=new Map(catalog.map(r=>[r.id,r.name]));const rows=await loadLines(MANIFEST_PATH);const latest=new Map();for(const row of rows)if(row.recipeId)latest.set(String(row.recipeId),row);let audited=0,invalidated=0,kept=0;for(const [id,row] of latest){if(row.status!=='complete')continue;audited++;const recipeName=names.get(id);if(!recipeName)continue;let valid=true;const stored=row.localPath?path.resolve(ROOT,row.localPath):path.join(IMAGE_ROOT,id,'hero.webp');if(!exists(stored))valid=false;const isExact=row.resolver==='exact-dataset';if(!isExact){if(!row.sourcePageUrl||badHost(row.sourcePageUrl))valid=false;else{try{const page=await fetchText(row.sourcePageUrl);if(!matches(recipeName,titles(page.html)))valid=false;}catch{valid=false;}}}if(valid){kept++;continue;}invalidated++;await fs.rm(stored,{force:true}).catch(()=>{});const repair={recipeId:id,recipeName,status:'needs_reprocess',reason:'Existing complete image failed provenance/title audit',previousResolver:row.resolver||null,auditedAt:now()};await fs.appendFile(MANIFEST_PATH,`${JSON.stringify(repair)}\n`);latest.set(id,repair);await sleep(10);}console.log(JSON.stringify({status:'complete',audited,kept,invalidated},null,2));}
main().catch((e)=>{console.error(e);process.exit(1);});
