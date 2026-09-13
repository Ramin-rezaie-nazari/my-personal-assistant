import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_ROOT || process.cwd());
const CATALOG_DIR = path.resolve(process.env.SPORT_CATALOG_OUT || path.join(ROOT, 'data', 'mypa-sports-catalog-expanded'));
const OUT = path.resolve(process.env.SPORT_MEDIA_OUT || path.join(ROOT, 'data', 'mypa-sports-media-local'));
const PER = Math.min(Math.max(Number(process.env.SPORT_MEDIA_PER_EXERCISE || '3'), 1), 5);
const UA = 'MYPA-Sports-Media-Downloader/1.0';
const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function webp(input) {
  let best;
  for (const width of [1200, 1000, 800, 700, 600, 500]) for (const quality of [86, 76, 66, 56, 46, 36, 26]) {
    const b = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
    if (!best || Math.abs(b.length - 110 * 1024) < Math.abs(best.length - 110 * 1024)) best = b;
    if (b.length <= 150 * 1024 && b.length >= 20 * 1024) return b;
  }
  return best;
}
async function load() {
  const gym = JSON.parse(await fs.readFile(path.join(CATALOG_DIR, 'sports-catalog.json'), 'utf8'));
  let yoga = [];
  const yp = path.join(CATALOG_DIR, 'yoga-catalog.json');
  if (exists(yp)) yoga = JSON.parse(await fs.readFile(yp, 'utf8'));
  return [...gym, ...yoga];
}
async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const manifest = path.join(OUT, 'manifest.jsonl');
  const done = new Set();
  if (exists(manifest)) for (const line of (await fs.readFile(manifest, 'utf8')).split(/\r?\n/)) try { const x = JSON.parse(line); if (x.status === 'complete') done.add(`${x.sport}/${x.id}`); } catch {}
  const items = await load(); let n = 0;
  for (const item of items) {
    n += 1; const key = `${item.sport}/${item.id}`;
    if (done.has(key)) { console.log(JSON.stringify({ progress: `${n}/${items.length}`, skipped: key })); continue; }
    const dir = path.join(OUT, item.sport, slug(item.id)); await fs.mkdir(dir, { recursive: true });
    let saved = 0;
    for (const url of (item.images || []).slice(0, PER * 2)) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (!r.ok) continue;
        const out = await webp(Buffer.from(await r.arrayBuffer())); if (!out) continue;
        const file = path.join(dir, `step-${String(saved + 1).padStart(2, '0')}.webp`); await fs.writeFile(file, out);
        await fs.appendFile(manifest, `${JSON.stringify({ sport: item.sport, id: item.id, name: item.name, step: saved + 1, status: 'complete', source: item.source, sourceUrl: url, bytes: out.length, sha256: hash(out), generatedAt: new Date().toISOString() })}\n`);
        saved += 1; if (saved >= PER) break;
      } catch {}
      await sleep(150);
    }
    if (!saved) await fs.appendFile(manifest, `${JSON.stringify({ sport: item.sport, id: item.id, name: item.name, status: 'no-result', generatedAt: new Date().toISOString() })}\n`);
    console.log(JSON.stringify({ progress: `${n}/${items.length}`, sport: item.sport, exercise: item.name, images: saved }));
    await sleep(250);
  }
  console.log(JSON.stringify({ status: 'complete', records: items.length, output: OUT, imagesPerRecord: PER }));
}
main().catch((e) => { console.error(e); process.exit(1); });
