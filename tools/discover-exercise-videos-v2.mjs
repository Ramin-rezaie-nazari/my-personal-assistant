#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const catalogPath = path.resolve(process.argv[2] ?? 'data/mypa-exercisedb-v1/catalog.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/mypa-exercise-video-discovery.json');
const limit = Number(process.env.EXERCISE_VIDEO_LIMIT ?? 0);
const concurrency = Math.max(1, Number(process.env.EXERCISE_VIDEO_CONCURRENCY ?? 4));
const delayMs = Math.max(0, Number(process.env.EXERCISE_VIDEO_DELAY_MS ?? 100));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function normalize(value) {
  return String(value ?? '').toLowerCase().normalize('NFKD').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(value) { return normalize(value).split(' ').filter((x) => x.length >= 3); }
const STOP = new Set(['exercise','workout','training','male','female','variation','improved','classic','traditional','simple','advanced','style','strength','version','v','on','with','the','a','an','and','for','from']);
function coreTokens(value) { return tokens(value).filter((x) => !STOP.has(x)); }
function score(name, candidate) {
  const a = normalize(name); const b = normalize(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const at = new Set(coreTokens(name)); const bt = new Set(coreTokens(candidate));
  if (!at.size || !bt.size) return 0;
  let hits = 0; for (const t of at) if (bt.has(t)) hits++;
  const overlap = hits / at.size;
  if (b.includes(a) || a.includes(b)) return Math.max(.9, overlap);
  return overlap;
}
function queryVariants(name) {
  const n = normalize(name);
  const stripped = n.replace(/\b(v\.?\s*\d+|male|female|variation|improved|classic|traditional|simple|advanced|style|version|with|on|using|against)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const core = coreTokens(name).join(' ');
  return [...new Set([n, stripped, core, `${core} exercise`, `${core} fitness`].filter(Boolean))];
}
async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'MYPA-exercise-video-discovery/2.0', Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function commonsSearch(exercise) {
  const all = new Map(); const errors = [];
  for (const q of queryVariants(exercise.name)) {
    try {
      const u = new URL('https://commons.wikimedia.org/w/api.php');
      u.search = new URLSearchParams({ action:'query', format:'json', list:'search', srsearch:q, srnamespace:'6', srlimit:'20' }).toString();
      const data = await getJson(u);
      for (const item of data?.query?.search ?? []) {
        if (!all.has(item.pageid)) all.set(item.pageid, item.title);
      }
    } catch (e) { errors.push(`${q}: ${e instanceof Error ? e.message : String(e)}`); }
    await sleep(delayMs);
  }
  const results=[];
  for (const [pageid,title] of all) {
    try {
      const u = new URL('https://commons.wikimedia.org/w/api.php');
      u.search = new URLSearchParams({ action:'query', format:'json', pageids:String(pageid), prop:'imageinfo', iiprop:'url|mime|size|extmetadata', iiextmetadatalanguage:'en' }).toString();
      const data = await getJson(u); const page = data?.query?.pages?.[String(pageid)]; const info = page?.imageinfo?.[0]; if (!info) continue;
      const meta = info.extmetadata ?? {}; const mime = String(info.mime ?? '').toLowerCase();
      if (!(mime.startsWith('video/') || /\.(webm|mp4|ogv|mov)$/i.test(title))) continue;
      const license = String(meta.LicenseShortName?.value ?? '').replace(/<[^>]*>/g,'').trim();
      const usageTerms = String(meta.UsageTerms?.value ?? '').replace(/<[^>]*>/g,'').trim();
      const description = String(meta.ImageDescription?.value ?? '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
      const titleScore = score(exercise.name,title); const descScore = score(exercise.name,description); const finalScore=Math.max(titleScore,descScore);
      const l=normalize(license);
      const open = l.includes('cc0') || l.includes('public domain') || l.includes('cc by') || l.includes('cc-by');
      results.push({source:'wikimedia_commons',title,url:info.url ?? null,sourceUrl:`https://commons.wikimedia.org/wiki/${encodeURIComponent(title).replace(/%2F/g,'/')}`,license:license||null,usageTerms:usageTerms||null,creator:String(meta.Artist?.value ?? '').replace(/<[^>]*>/g,'').trim()||null,mimeType:info.mime??null,width:info.width??null,height:info.height??null,score:finalScore,exactMatch:finalScore>=0.9,rightsClass:open?'open-license-candidate':'rights-review-required',commercialUseExpected:open,attributionRequired:open && !l.includes('cc0') && !l.includes('public domain')});
    } catch (e) { errors.push(`${title}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  results.sort((a,b)=>((b.exactMatch?100:0)+b.score*50+(b.rightsClass==='open-license-candidate'?5:0))-((a.exactMatch?100:0)+a.score*50+(a.rightsClass==='open-license-candidate'?5:0)));
  return {results:results.slice(0,10),errors};
}
async function discover(exercise,index,total){
  const c=await commonsSearch(exercise);
  const best=c.results[0]??null;
  return {exerciseId:exercise.exerciseId,name:exercise.name,bestCandidate:best,candidates:c.results,status:best?(best.exactMatch&&best.rightsClass==='open-license-candidate'?'open_exact_candidate':best.exactMatch?'exact_candidate_rights_review':'candidate_review'):'not_found',errors:c.errors,index:index+1,total};
}
async function mapLimit(items,worker){let cursor=0;const out=new Array(items.length);async function run(){while(true){const i=cursor++;if(i>=items.length)return;out[i]=await worker(items[i],i);console.log(`[${i+1}/${items.length}] ${items[i].name}: ${out[i].status}${out[i].bestCandidate?` → ${out[i].bestCandidate.title}`:''}`);}}await Promise.all(Array.from({length:concurrency},run));return out;}
const catalog=JSON.parse(await fs.readFile(catalogPath,'utf8')); if(!Array.isArray(catalog)) throw new Error('Catalog must be an array');
const exercises=catalog.filter(x=>x?.exerciseId&&x?.name).slice(0,limit||undefined);
console.log(`Discovering ${exercises.length} exercises against Wikimedia Commons...`);
const results=await mapLimit(exercises,discover);
const counts={openExactCandidates:results.filter(x=>x.status==='open_exact_candidate').length,exactRightsReviewCandidates:results.filter(x=>x.status==='exact_candidate_rights_review').length,candidateReview:results.filter(x=>x.status==='candidate_review').length,notFound:results.filter(x=>x.status==='not_found').length,withErrors:results.filter(x=>x.errors.length>0).length};
await fs.mkdir(path.dirname(outputPath),{recursive:true}); await fs.writeFile(outputPath,JSON.stringify({generatedAt:new Date().toISOString(),catalogRecords:catalog.length,processedRecords:results.length,counts,results},null,2)+'\n');
console.log(JSON.stringify(counts,null,2));
