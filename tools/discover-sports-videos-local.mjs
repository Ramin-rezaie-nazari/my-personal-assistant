import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.env.MYPA_ROOT || process.cwd());
const CATALOG = path.resolve(process.env.SPORT_CATALOG_OUT || path.join(ROOT, 'data', 'mypa-sports-catalog-expanded'));
const OUT = path.resolve(process.env.SPORT_VIDEO_OUT || path.join(ROOT, 'data', 'mypa-sports-videos-local'));
const PER = Math.min(Math.max(Number(process.env.SPORT_VIDEO_PER_EXERCISE || '2'), 1), 3);
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'MYPA-Sports-Video-Discovery/1.0';
const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function catalog() {
  const gym = JSON.parse(await fs.readFile(path.join(CATALOG, 'sports-catalog.json'), 'utf8'));
  const yp = path.join(CATALOG, 'yoga-catalog.json');
  const yoga = exists(yp) ? JSON.parse(await fs.readFile(yp, 'utf8')) : [];
  return [...gym, ...yoga];
}
async function search(item) {
  const query = `${item.name} ${item.sport === 'yoga' ? 'yoga pose' : 'exercise'} filetype:video`;
  const u = new URL(API);
  u.search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|mime|size|width|height|extmetadata', iiurlwidth: '720' });
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Commons HTTP ${r.status}`);
  const data = await r.json();
  const target = norm(item.name).split(' ').filter((x) => x.length > 2);
  return Object.values(data.query?.pages || {}).map((p) => {
    const info = p.imageinfo?.[0] || {};
    const text = norm(`${p.title || ''} ${info.extmetadata?.ImageDescription?.value || ''}`);
    const relevance = target.filter((w) => text.includes(w)).length / Math.max(target.length, 1);
    return { title: p.title, fileUrl: info.url, mime: info.mime, size: info.size || null, width: info.width || null, height: info.height || null, pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(p.title || '').replaceAll(' ', '_'))}`, license: info.extmetadata?.LicenseShortName?.value || null, author: info.extmetadata?.Artist?.value || null, relevance };
  }).filter((x) => x.fileUrl && /^video\//i.test(x.mime || '') && x.relevance >= 0.45).sort((a, b) => b.relevance - a.relevance).slice(0, PER);
}
async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const manifest = path.join(OUT, 'video-manifest.jsonl');
  const done = new Set();
  if (exists(manifest)) for (const line of (await fs.readFile(manifest, 'utf8')).split(/\r?\n/)) try { const x = JSON.parse(line); if (x.status === 'complete' || x.status === 'no-result') done.add(`${x.sport}/${x.id}`); } catch {}
  const items = await catalog(); let n = 0;
  for (const item of items) {
    n += 1; const key = `${item.sport}/${item.id}`;
    if (done.has(key)) { console.log(JSON.stringify({ progress: `${n}/${items.length}`, skipped: key })); continue; }
    try {
      const videos = await search(item);
      await fs.appendFile(manifest, `${JSON.stringify({ sport: item.sport, id: item.id, name: item.name, status: videos.length ? 'complete' : 'no-result', source: 'Wikimedia Commons', videos, generatedAt: new Date().toISOString() })}\n`);
      console.log(JSON.stringify({ progress: `${n}/${items.length}`, sport: item.sport, exercise: item.name, videos: videos.length }));
    } catch (e) {
      await fs.appendFile(manifest, `${JSON.stringify({ sport: item.sport, id: item.id, name: item.name, status: 'failed', error: String(e), generatedAt: new Date().toISOString() })}\n`);
      console.error(JSON.stringify({ progress: `${n}/${items.length}`, exercise: item.name, error: String(e) }));
    }
    await sleep(350);
  }
  const rows = (await fs.readFile(manifest, 'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const summary = { status: 'complete', records: items.length, withVideos: rows.filter((x) => x.status === 'complete').length, withoutVideos: rows.filter((x) => x.status === 'no-result').length, failed: rows.filter((x) => x.status === 'failed').length, output: OUT, note: 'Only freely hosted Wikimedia Commons video candidates are recorded. Review relevance and license before shipping.' };
  await fs.writeFile(path.join(OUT, 'video-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
