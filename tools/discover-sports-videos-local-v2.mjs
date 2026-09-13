import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.env.MYPA_ROOT || process.cwd());
const CATALOG = path.resolve(process.env.SPORT_CATALOG_OUT || path.join(ROOT, 'data', 'mypa-sports-catalog-expanded'));
const OUT = path.resolve(process.env.SPORT_VIDEO_OUT || path.join(ROOT, 'data', 'mypa-sports-videos-local'));
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'MYPA-Sports-Video-Discovery/2.0';
const WAIT = Math.max(Number(process.env.SPORT_VIDEO_WAIT_MS || '5000'), 3000);
const RETRIES = 5;
const exists = p => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function loadCatalog() {
  const gym = JSON.parse(await fs.readFile(path.join(CATALOG, 'sports-catalog.json'), 'utf8'));
  const yp = path.join(CATALOG, 'yoga-catalog.json');
  const yoga = exists(yp) ? JSON.parse(await fs.readFile(yp, 'utf8')) : [];
  return [...gym, ...yoga];
}
async function request(url) {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.ok) return r.json();
    if (r.status !== 429 && r.status < 500) throw new Error(`Commons HTTP ${r.status}`);
    const retry = Number(r.headers.get('retry-after') || 0);
    const delay = Math.max(retry * 1000, WAIT * (attempt + 1));
    console.error(JSON.stringify({ rateLimited: true, status: r.status, retryInMs: delay, attempt: attempt + 1 }));
    await sleep(delay);
  }
  throw new Error('Commons rate limit persisted after retries');
}
async function search(item) {
  const words = norm(item.name).split(' ').filter(x => x.length > 2);
  const q = `${item.name} ${item.sport === 'yoga' ? 'yoga pose' : 'exercise'}`;
  const u = new URL(API);
  u.search = new URLSearchParams({ action:'query', format:'json', origin:'*', generator:'search', gsrsearch:q, gsrnamespace:'6', gsrlimit:'10', prop:'imageinfo', iiprop:'url|mime|size|width|height|extmetadata' });
  const data = await request(u);
  return Object.values(data.query?.pages || {}).map(p => {
    const i = p.imageinfo?.[0] || {};
    const text = norm(`${p.title || ''} ${i.extmetadata?.ImageDescription?.value || ''}`);
    const relevance = words.filter(w => text.includes(w)).length / Math.max(words.length, 1);
    return { title:p.title, fileUrl:i.url, mime:i.mime, size:i.size || null, pageUrl:`https://commons.wikimedia.org/wiki/${encodeURIComponent(String(p.title || '').replaceAll(' ','_'))}`, license:i.extmetadata?.LicenseShortName?.value || null, author:i.extmetadata?.Artist?.value || null, relevance };
  }).filter(x => x.fileUrl && /^video\//i.test(x.mime || '') && x.relevance >= 0.45).sort((a,b) => b.relevance-a.relevance).slice(0,2);
}
async function main() {
  await fs.mkdir(OUT, { recursive:true });
  const manifest = path.join(OUT, 'video-manifest.jsonl');
  const done = new Set();
  if (exists(manifest)) for (const line of (await fs.readFile(manifest,'utf8')).split(/\r?\n/)) try { const x=JSON.parse(line); if (x.status==='complete') done.add(`${x.sport}/${x.id}`); } catch {}
  const items = await loadCatalog(); let n=0;
  for (const item of items) {
    n++; const key=`${item.sport}/${item.id}`;
    if (done.has(key)) { console.log(JSON.stringify({progress:`${n}/${items.length}`, skipped:key})); continue; }
    try {
      const videos=await search(item);
      await fs.appendFile(manifest, JSON.stringify({sport:item.sport,id:item.id,name:item.name,status:videos.length?'complete':'no-result',source:'Wikimedia Commons',videos,generatedAt:new Date().toISOString()})+'\n');
      console.log(JSON.stringify({progress:`${n}/${items.length}`,exercise:item.name,videos:videos.length}));
    } catch (e) {
      await fs.appendFile(manifest, JSON.stringify({sport:item.sport,id:item.id,name:item.name,status:'retry-later',error:String(e),generatedAt:new Date().toISOString()})+'\n');
      console.error(JSON.stringify({progress:`${n}/${items.length}`,exercise:item.name,error:String(e)}));
    }
    await sleep(WAIT);
  }
  const rows=(await fs.readFile(manifest,'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const summary={status:'complete',records:items.length,withVideos:rows.filter(x=>x.status==='complete').length,withoutVideos:rows.filter(x=>x.status==='no-result').length,retryLater:rows.filter(x=>x.status==='retry-later').length,output:OUT};
  await fs.writeFile(path.join(OUT,'video-summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify(summary,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
