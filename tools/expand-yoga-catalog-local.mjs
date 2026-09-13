import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.env.MYPA_ROOT || process.cwd());
const OUT = path.resolve(process.env.YOGA_CATALOG_OUT || path.join(ROOT, 'data', 'mypa-sports-catalog-expanded'));
const API = 'https://yoga-api-nzy4.onrender.com/v1/poses';
const UA = 'MYPA-Yoga-Catalog-Builder/1.0';
const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const level = (v) => { const x = clean(v).toLowerCase(); return x.includes('expert') ? 'expert' : x.includes('intermediate') ? 'intermediate' : 'beginner'; };
function inferFocus(p) { const t = `${p.english_name} ${p.pose_description} ${p.pose_benefits}`.toLowerCase(); return [...new Set([/balance|tree|warrior iii|half moon/.test(t) && 'balance', /flex|stretch|hip|hamstring|groin/.test(t) && 'flexibility', /strength|core|arm|shoulder/.test(t) && 'strength', /breath|relax|restor|calm/.test(t) && 'relaxation', /back|spine|chest|heart/.test(t) && 'mobility'].filter(Boolean))]; }
async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const res = await fetch(API, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Yoga API HTTP ${res.status}`);
  const raw = await res.json();
  const poses = Array.isArray(raw) ? raw : (raw.poses || raw.data || []);
  const records = poses.map((p) => ({
    id: `yoga_${norm(p.english_name || `pose_${p.id}`)}`,
    sourceId: p.id,
    source: 'alexcumplido/yoga-api',
    sourceLicense: 'MIT code/data attribution; verify image style license before commercial redistribution',
    sport: 'yoga',
    name: clean(p.english_name),
    sanskritName: clean(p.sanskrit_name || p.sanskrit_name_adapted),
    translationName: clean(p.translation_name),
    level: level(p.difficulty_level),
    focuses: inferFocus(p),
    description: clean(p.pose_description),
    benefits: clean(p.pose_benefits),
    contraindications: [],
    steps: clean(p.pose_description).split(/\.\s+/).filter(Boolean),
    images: [p.url_png, p.url_svg].filter(Boolean),
    mediaStatus: p.url_png ? 'source_images_available' : 'no_source_images',
    importedAt: new Date().toISOString(),
  })).filter((p) => p.name && p.description);
  await fs.writeFile(path.join(OUT, 'yoga-catalog.json'), JSON.stringify(records, null, 2));
  await fs.writeFile(path.join(OUT, 'yoga-catalog.jsonl'), records.map((x) => JSON.stringify(x)).join('\n') + '\n');
  const summary = { source: API, sourceCount: poses.length, normalizedCount: records.length, withInstructions: records.filter((x) => x.steps.length).length, withImages: records.filter((x) => x.images.length).length, output: OUT, generatedAt: new Date().toISOString() };
  await fs.writeFile(path.join(OUT, 'yoga-catalog-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
