import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.env.MYPA_ROOT || process.cwd());
const OUT = path.resolve(process.env.SPORT_CATALOG_OUT || path.join(ROOT, 'data', 'mypa-sports-catalog-expanded'));
const SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const UA = 'MYPA-Sports-Catalog-Builder/1.0';

const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const title = (value) => String(value ?? '').trim();
const uniq = (arr) => [...new Set(arr.filter(Boolean))];

function classify(ex) {
  const text = `${ex.name} ${(ex.category || '')} ${(ex.equipment || '')} ${(ex.primaryMuscles || []).join(' ')} ${(ex.secondaryMuscles || []).join(' ')}`.toLowerCase();
  const bodyweight = !ex.equipment || ['body only', 'none'].includes(ex.equipment.toLowerCase());
  const calisthenicsTerms = /(push|pull|chin|dip|muscle|handstand|planche|front lever|back lever|pistol|burpee|plank|bodyweight|inverted row|l.?sit|hanging|crunch|leg raise)/;
  return bodyweight && calisthenicsTerms.test(text) ? 'calisthenics' : 'gym';
}

function toRecord(ex) {
  const sport = classify(ex);
  const primary = (ex.primaryMuscles || []).map(normalize);
  const secondary = (ex.secondaryMuscles || []).map(normalize);
  const instructions = (ex.instructions || []).map(title).filter(Boolean);
  const images = (ex.images || []).map((p) => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${p}`);
  return {
    id: `${sport}_${normalize(ex.id || ex.name)}`,
    sourceId: ex.id,
    source: 'yuhonas/free-exercise-db',
    sourceLicense: 'Unlicense',
    sport,
    name: title(ex.name),
    aliases: [],
    category: normalize(ex.category || 'strength'),
    level: normalize(ex.level || 'beginner'),
    equipment: normalize(ex.equipment || 'none'),
    force: normalize(ex.force),
    mechanic: normalize(ex.mechanic),
    primaryMuscles: uniq(primary),
    secondaryMuscles: uniq(secondary),
    instructions,
    images,
    mediaStatus: images.length ? 'source_images_available' : 'no_source_images',
    importedAt: new Date().toISOString(),
  };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const rawPath = path.join(OUT, 'free-exercise-db.json');
  const res = await fetch(SOURCE, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Dataset download failed: HTTP ${res.status}`);
  const raw = await res.json();
  const source = Array.isArray(raw) ? raw : (raw.exercises || raw.data || []);
  const records = source.map(toRecord).filter((x) => x.name && x.instructions.length);
  const seen = new Set();
  const deduped = records.filter((x) => { const k = `${x.sport}/${normalize(x.name)}`; if (seen.has(k)) return false; seen.add(k); return true; });
  await fs.writeFile(rawPath, JSON.stringify(source, null, 2));
  await fs.writeFile(path.join(OUT, 'sports-catalog.json'), JSON.stringify(deduped, null, 2));
  await fs.writeFile(path.join(OUT, 'sports-catalog.jsonl'), deduped.map((x) => JSON.stringify(x)).join('\n') + '\n');
  const summary = {
    source: SOURCE,
    sourceLicense: 'Unlicense',
    sourceCount: source.length,
    normalizedCount: deduped.length,
    bySport: Object.fromEntries(['gym', 'calisthenics'].map((s) => [s, deduped.filter((x) => x.sport === s).length])),
    withInstructions: deduped.filter((x) => x.instructions.length).length,
    withImages: deduped.filter((x) => x.images.length).length,
    output: OUT,
    generatedAt: new Date().toISOString(),
    note: 'This public dataset substantially expands strength/bodyweight coverage. Yoga poses require a separate pose-specific catalog and are not silently mislabeled as gym exercises.',
  };
  await fs.writeFile(path.join(OUT, 'catalog-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
