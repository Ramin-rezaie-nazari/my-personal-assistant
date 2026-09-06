import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET = Number(process.env.FITNESS_TARGET_PER_DISCIPLINE ?? 500);
const STRICT = process.env.FITNESS_IMPORT_STRICT === '1';
const COMMONS_CONCURRENCY = Number(process.env.FITNESS_COMMONS_CONCURRENCY ?? 4);
const WEBP_ROOT = 'https://wsrv.nl/';
const REPDB_DATASET = 'https://exercise-dataset.com/exercises.json';
const FREEDB_DATASET = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FREEDB_IMAGE_ROOT = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

const ALLOWED_LICENSES = [
  'cc0',
  'cc by',
  'cc by-sa',
  'public domain',
  'pd',
  'pdm',
];

const YOGA_HINTS = new Set([
  'asana', 'yoga', 'pose', 'warrior', 'triangle', 'tree', 'cobra', 'pigeon', 'child',
  'downward', 'upward', 'plank', 'boat', 'bridge', 'camel', 'corpse', 'mountain',
  'dancer', 'crow', 'lotus', 'half moon', 'happy baby', 'fish', 'locust', 'sphinx',
  'lunge', 'twist', 'forward fold', 'head to knee', 'cow face', 'eagle', 'garland',
]);

const YOGA_VARIATIONS = [
  'Supported', 'Dynamic', 'Prep', 'Flow', 'Left', 'Right', 'Kneeling', 'Seated',
  'Standing', 'Wall Supported', 'Block Supported', 'Gentle', 'Active', 'Extended',
];

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'MYPA-fitness-ingester/1.0' } });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

function text(value) {
  return String(value ?? '').trim();
}

function normalize(value) {
  return text(value)
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\u00c0-\u024f\s+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  const slug = normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || createHash('sha1').update(text(value)).digest('hex').slice(0, 12);
}

function idFor(discipline, slug) {
  return createHash('sha256').update(`${discipline}:${slug}`).digest('hex').slice(0, 32);
}

function licenseAllowed(value) {
  const license = normalize(value);
  return ALLOWED_LICENSES.some((allowed) => license === allowed || license.startsWith(`${allowed} `));
}

function webpUrl(sourceUrl) {
  return sourceUrl.includes('output=webp') || sourceUrl.endsWith('.webp')
    ? sourceUrl
    : `${WEBP_ROOT}?url=${encodeURIComponent(sourceUrl)}&output=webp&w=768&q=82`;
}

function mapDifficulty(value) {
  const level = normalize(value);
  if (level === 'beginner' || level === 'easy') return 1;
  if (level === 'foundation') return 3;
  if (level === 'intermediate' || level === 'medium') return 5;
  if (level === 'advanced' || level === 'hard') return 7;
  if (level === 'expert') return 9;
  if (level === 'elite') return 10;
  return 5;
}

function isYogaRecord(record) {
  const haystack = normalize([
    record.name_en, record.name, record.category, record.body_part,
    ...(record.tags ?? []), ...(record.goals ?? []),
  ].join(' '));
  return [...YOGA_HINTS].some((hint) => haystack.includes(hint));
}

function classifyRepDb(record) {
  if (isYogaRecord(record)) return 'yoga';
  const equipment = normalize(record.equipment ?? 'bodyweight');
  const bodyweight = !equipment || equipment === 'bodyweight' || equipment === 'none' || equipment === 'body only';
  return bodyweight || record.is_bodyweight ? 'calisthenics' : 'gym';
}

function classifyFreeDb(record) {
  if (normalize(record.category) === 'stretching' && isYogaRecord(record)) return 'yoga';
  if (isYogaRecord(record)) return 'yoga';
  const equipment = normalize(record.equipment ?? 'none');
  const bodyweight = !equipment || equipment === 'body only' || equipment === 'none';
  return bodyweight || record.is_bodyweight ? 'calisthenics' : 'gym';
}

function repDbRecord(record) {
  const images = record.images?.flat ?? {};
  const imagePairs = [];
  for (const [position, relative] of Object.entries(images)) {
    if (!relative) continue;
    const sourceUrl = `https://exercise-dataset.com/${String(relative).replace(/^\//, '')}`;
    imagePairs.push({
      position,
      sourceUrl,
      webpUrl: webpUrl(sourceUrl),
      format: 'webp',
      sourceProvider: 'RepDB',
      license: 'commercial-in-app-with-attribution',
      attribution: 'Exercise data by RepDB (repdb.co)',
    });
  }
  return {
    name: text(record.name_en ?? record.name),
    description: text(record.description_en ?? ''),
    difficultyLevel: mapDifficulty(record.difficulty),
    sourceLevel: text(record.difficulty),
    focus: [...(record.primary_muscles ?? []), ...(record.secondary_muscles ?? []), record.body_part].filter(Boolean).slice(0, 12).map(text),
    equipment: record.equipment ? [text(record.equipment)] : ['none'],
    instructions: Array.isArray(record.instructions_en) ? record.instructions_en.map(text).filter(Boolean) : [],
    cues: Array.isArray(record.tips_en) ? record.tips_en.map(text).filter(Boolean) : [],
    sourceUrl: REPDB_DATASET,
    sourceProvider: 'RepDB',
    license: 'commercial-in-app-with-attribution',
    attribution: 'Exercise data by RepDB (repdb.co)',
    media: imagePairs,
    sourceId: text(record.id),
  };
}

function freeDbRecord(record) {
  const images = Array.isArray(record.images) ? record.images.slice(0, 4) : [];
  const media = images.map((relative, index) => {
    const sourceUrl = `${FREEDB_IMAGE_ROOT}${relative}`;
    return {
      position: `source-${index + 1}`,
      sourceUrl,
      webpUrl: webpUrl(sourceUrl),
      format: 'webp',
      sourceProvider: 'Free Exercise DB',
      license: 'public-domain',
      attribution: 'Yuhonas / Free Exercise DB',
    };
  });
  return {
    name: text(record.name ?? record.name_en),
    description: text(record.description ?? record.description_en ?? ''),
    difficultyLevel: mapDifficulty(record.level ?? record.difficulty),
    sourceLevel: text(record.level ?? record.difficulty),
    focus: [...(record.primaryMuscles ?? record.primary_muscles ?? []), ...(record.secondaryMuscles ?? record.secondary_muscles ?? [])].filter(Boolean).slice(0, 12).map(text),
    equipment: record.equipment ? [text(record.equipment)] : ['none'],
    instructions: Array.isArray(record.instructions) ? record.instructions.map(text).filter(Boolean) : Array.isArray(record.instructions_en) ? record.instructions_en.map(text).filter(Boolean) : [],
    cues: Array.isArray(record.tips_en) ? record.tips_en.map(text).filter(Boolean) : [],
    sourceUrl: FREEDB_DATASET,
    sourceProvider: 'Free Exercise DB',
    license: 'public-domain',
    attribution: 'Yuhonas / Free Exercise DB',
    media,
    sourceId: text(record.id),
  };
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = normalize(candidate.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function makeYogaVariants(baseCandidates) {
  const variants = [];
  const seen = new Set(baseCandidates.map((item) => normalize(item.name)));
  for (const base of baseCandidates) {
    for (const variation of YOGA_VARIATIONS) {
      if (variants.length + baseCandidates.length >= TARGET) return variants;
      const name = `${variation} ${base.name}`;
      const key = normalize(name);
      if (seen.has(key)) continue;
      seen.add(key);
      variants.push({
        ...base,
        name,
        description: `${variation} variation of ${base.name}.`,
        variantKind: variation.toLowerCase().replace(/\s+/g, '_'),
        parentName: base.name,
        media: [],
        instructions: [...base.instructions, `Perform the ${variation.toLowerCase()} variation only within a comfortable range of motion.`],
      });
    }
  }
  return variants;
}

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime|size',
    iiurlwidth: '768',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`${COMMONS_API}?${params.toString()}`, { headers: { 'user-agent': 'MYPA-fitness-ingester/1.0' } });
  if (!response.ok) return [];
  const payload = await response.json();
  return Object.values(payload.query?.pages ?? {})
    .map((page) => page.imageinfo?.[0])
    .map((info) => ({
      sourceUrl: info.url,
      webpUrl: webpUrl(info.thumburl ?? info.url),
      format: 'webp',
      license: text(info.extmetadata?.LicenseShortName?.value),
      attribution: text(info.extmetadata?.Artist?.value),
      sourceProvider: 'Wikimedia Commons',
    }))
    .filter((item) => item.sourceUrl && licenseAllowed(item.license));
}

async function enrichMedia(candidates) {
  const queue = candidates.filter((item) => item.media.length < 4);
  let cursor = 0;
  const workers = Array.from({ length: COMMONS_CONCURRENCY }, async () => {
    while (cursor < queue.length) {
      const index = cursor++;
      const item = queue[index];
      const commons = await searchCommons(`${item.name} exercise`);
      const used = new Set(item.media.map((media) => media.sourceUrl));
      for (const media of commons) {
        if (used.has(media.sourceUrl)) continue;
        item.media.push({ ...media, position: `commons-${item.media.length + 1}` });
        used.add(media.sourceUrl);
        if (item.media.length >= 4) break;
      }
    }
  });
  await Promise.all(workers);
}

async function upsertExercise(item, discipline, parentExerciseId = null) {
  const slug = slugify(item.name);
  const id = idFor(discipline, slug);
  const completeMedia = item.media
    .filter((media) => media.sourceUrl && media.webpUrl)
    .slice(0, 4);
  const published = completeMedia.length >= 4;
  const sourceLicense = text(item.license) || 'unknown';
  if (!published && STRICT) throw new Error(`${discipline}/${slug} has ${completeMedia.length}/4 approved WebP assets`);

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "FitnessExerciseCatalog" (
      "id", "discipline", "slug", "name", "description", "difficultyLevel", "sourceLevel",
      "parentExerciseId", "variantKind", "focus", "equipment", "instructions", "cues",
      "sourceProvider", "sourceUrl", "license", "attribution", "status", "publishedAt"
    ) VALUES (
      ${id}, ${discipline}, ${slug}, ${item.name}, ${item.description || null}, ${Math.max(1, Math.min(10, item.difficultyLevel))},
      ${item.sourceLevel || null}, ${parentExerciseId}, ${item.variantKind || null}, ${item.focus}, ${item.equipment}, ${item.instructions}, ${item.cues},
      ${item.sourceProvider}, ${item.sourceUrl || null}, ${sourceLicense}, ${item.attribution || null}, ${published ? 'published' : 'draft'}, ${published ? new Date() : null}
    )
    ON CONFLICT ("discipline", "slug") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "difficultyLevel" = EXCLUDED."difficultyLevel",
      "sourceLevel" = EXCLUDED."sourceLevel",
      "parentExerciseId" = EXCLUDED."parentExerciseId",
      "variantKind" = EXCLUDED."variantKind",
      "focus" = EXCLUDED."focus",
      "equipment" = EXCLUDED."equipment",
      "instructions" = EXCLUDED."instructions",
      "cues" = EXCLUDED."cues",
      "sourceProvider" = EXCLUDED."sourceProvider",
      "sourceUrl" = EXCLUDED."sourceUrl",
      "license" = EXCLUDED."license",
      "attribution" = EXCLUDED."attribution",
      "status" = EXCLUDED."status",
      "publishedAt" = EXCLUDED."publishedAt",
      "updatedAt" = CURRENT_TIMESTAMP
  `);

  await prisma.$executeRaw(Prisma.sql`DELETE FROM "FitnessExerciseMedia" WHERE "exerciseId" = ${id}`);
  for (let index = 0; index < completeMedia.length; index += 1) {
    const media = completeMedia[index];
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "FitnessExerciseMedia" (
        "id", "exerciseId", "position", "sourceUrl", "webpUrl", "format", "sourceProvider", "license", "attribution", "status"
      ) VALUES (
        ${randomUUID()}, ${id}, ${index + 1}, ${media.sourceUrl}, ${media.webpUrl}, 'webp', ${media.sourceProvider}, ${media.license}, ${media.attribution || null}, ${published ? 'approved' : 'pending'}
      )
    `);
  }
  return id;
}

async function main() {
  console.log(`MYPA fitness content import: target=${TARGET}/discipline strict=${STRICT}`);
  const [repDb, freeDb] = await Promise.all([fetchJson(REPDB_DATASET), fetchJson(FREEDB_DATASET)]);

  const candidates = { gym: [], calisthenics: [], yoga: [] };
  for (const record of repDb.exercises ?? []) {
    const discipline = classifyRepDb(record);
    const normalized = repDbRecord(record);
    if (normalized.license && discipline) candidates[discipline].push(normalized);
  }
  for (const record of Array.isArray(freeDb) ? freeDb : freeDb.exercises ?? []) {
    const discipline = classifyFreeDb(record);
    const normalized = freeDbRecord(record);
    candidates[discipline].push(normalized);
  }

  candidates.gym = dedupeCandidates(candidates.gym).slice(0, TARGET);
  candidates.calisthenics = dedupeCandidates(candidates.calisthenics).slice(0, TARGET);
  candidates.yoga = dedupeCandidates(candidates.yoga);
  if (candidates.yoga.length < TARGET) {
    candidates.yoga.push(...makeYogaVariants(candidates.yoga));
  }
  candidates.yoga = dedupeCandidates(candidates.yoga).slice(0, TARGET);

  await enrichMedia([...candidates.gym, ...candidates.calisthenics, ...candidates.yoga]);

  const idByName = new Map();
  for (const discipline of ['gym', 'calisthenics', 'yoga']) {
    for (const item of candidates[discipline]) {
      const slug = slugify(item.name);
      const parentId = item.parentName ? idByName.get(`${discipline}:${normalize(item.parentName)}`) ?? null : null;
      const id = await upsertExercise(item, discipline, parentId);
      idByName.set(`${discipline}:${normalize(item.name)}`, id);
    }
  }

  const summary = {};
  for (const discipline of ['gym', 'calisthenics', 'yoga']) {
    const rows = await prisma.$queryRaw<Array<{ total: number; ready: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE c."status" = 'published' AND (
          SELECT COUNT(*) FROM "FitnessExerciseMedia" m WHERE m."exerciseId" = c."id" AND m."status" = 'approved' AND m."format" = 'webp'
        ) >= 4)::int AS ready
      FROM "FitnessExerciseCatalog" c WHERE c."discipline" = ${discipline}
    `);
    summary[discipline] = { total: Number(rows[0]?.total ?? 0), ready: Number(rows[0]?.ready ?? 0) };
  }
  console.table(summary);
  if (STRICT && Object.values(summary).some((item) => item.ready < TARGET)) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
