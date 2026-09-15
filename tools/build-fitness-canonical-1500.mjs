#!/usr/bin/env node

/** Build MYPA's canonical 1,500-exercise metadata catalog. Media is excluded. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outputPath = path.resolve(process.argv[2] ?? path.join(repoRoot, 'data/fitness-canonical-exercises-1500.generated.json'));
const reportPath = path.resolve(process.argv[3] ?? path.join(repoRoot, 'data/fitness-canonical-exercises-1500.report.generated.json'));
const targetCount = 1500;

const sources = [
  { id: 'gymvisual-metadata-mit', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json', license: 'MIT for non-media dataset metadata/instructions; media is excluded' },
  { id: 'kinetic-place-exercises-mit', url: 'https://raw.githubusercontent.com/kinetic-place/exercises-json/main/en/exercises.json', license: 'MIT' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeText(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function slugify(value) { return normalizeText(value).replace(/\s+/g, '-').slice(0, 120) || 'exercise'; }
function list(value) {
  if (Array.isArray(value)) return value.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,|]/).map((x) => x.trim()).filter(Boolean);
  return [];
}
function firstString(...values) { return values.find((x) => typeof x === 'string' && x.trim())?.trim() ?? null; }
function adaptRecord(raw, sourceId) {
  const name = firstString(raw?.name, raw?.exercise, raw?.title);
  if (!name) return null;
  const category = firstString(raw?.category, raw?.body_part, raw?.bodyPart, raw?.bodyPartName) ?? 'general';
  const instructions = firstString(raw?.instructions?.en, raw?.instructions, raw?.description, raw?.instructionsText);
  const steps = Array.isArray(raw?.instruction_steps?.en) ? raw.instruction_steps.en : Array.isArray(raw?.steps) ? raw.steps : [];
  return {
    sourceId,
    sourceExerciseId: firstString(raw?.id, raw?.exerciseId, raw?.slug),
    name,
    normalizedName: normalizeText(name),
    aliases: [...new Set(list(raw?.aliases ?? raw?.synonyms ?? raw?.alternativeNames))],
    discipline: firstString(raw?.discipline, raw?.category, category) ?? 'general',
    movementPattern: firstString(raw?.movementPattern, raw?.movement_pattern, raw?.movement),
    primaryMuscles: [...new Set(list(raw?.primary_muscles ?? raw?.primaryMuscles ?? raw?.targetMuscles ?? raw?.target ?? raw?.muscles))],
    secondaryMuscles: [...new Set(list(raw?.secondary_muscles ?? raw?.secondaryMuscles ?? raw?.secondaryMuscleGroups))],
    equipment: [...new Set(list(raw?.equipment ?? raw?.equipmentList ?? raw?.equipments))],
    difficulty: firstString(raw?.difficulty, raw?.level),
    goals: list(raw?.goals ?? raw?.goal),
    instructions,
    instructionSteps: steps.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()),
  };
}
async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { stdout } = await execFileAsync('curl', ['--fail-with-body', '--silent', '--show-error', '--location', '--max-time', '90', '--retry', '1', '--retry-delay', '2', '--user-agent', 'MYPA-canonical-exercise-builder/1.0', url], { maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(stdout);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1500 * attempt);
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.exercises)) return payload.exercises;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new Error('Unsupported exercise dataset shape');
}

const byName = new Map();
const sourceCounts = {};
for (const source of sources) {
  const records = extractArray(await fetchJson(source.url));
  sourceCounts[source.id] = records.length;
  console.log(`Loaded ${source.id}: ${records.length} raw records`);
  for (const raw of records) {
    const record = adaptRecord(raw, source.id);
    if (!record) continue;
    const existing = byName.get(record.normalizedName);
    if (!existing) {
      byName.set(record.normalizedName, record);
      continue;
    }
    existing.aliases = [...new Set([...existing.aliases, record.name, ...record.aliases])];
    existing.primaryMuscles = [...new Set([...existing.primaryMuscles, ...record.primaryMuscles])];
    existing.secondaryMuscles = [...new Set([...existing.secondaryMuscles, ...record.secondaryMuscles])];
    existing.equipment = [...new Set([...existing.equipment, ...record.equipment])];
  }
}

const unique = [...byName.values()].sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
if (unique.length < targetCount) throw new Error(`Only ${unique.length} unique exercise names available; cannot build ${targetCount}`);

const selected = unique.slice(0, targetCount).map((record) => ({
  id: `ex_${slugify(record.name)}`,
  slug: slugify(record.name),
  name: record.name,
  nameFa: null,
  aliases: record.aliases,
  discipline: record.discipline,
  movementPattern: record.movementPattern,
  primaryMuscles: record.primaryMuscles,
  secondaryMuscles: record.secondaryMuscles,
  equipment: record.equipment,
  difficulty: record.difficulty,
  goals: record.goals,
  instructions: record.instructions,
  instructionSteps: record.instructionSteps,
  source: { dataset: record.sourceId, sourceExerciseId: record.sourceExerciseId, mediaIncluded: false },
}));

const slugCounts = new Map();
for (const exercise of selected) slugCounts.set(exercise.slug, (slugCounts.get(exercise.slug) ?? 0) + 1);
const slugConflicts = [...slugCounts.entries()].filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));
const greenGate = selected.length === targetCount && slugConflicts.length === 0;

const output = { schemaVersion: 1, generatedAt: new Date().toISOString(), targetCount, canonicalExerciseCount: selected.length, duplicateConflictCount: slugConflicts.length, sourceCounts, sourceUrls: sources, exercises: selected };
const report = { generatedAt: output.generatedAt, canonicalExerciseCount: selected.length, targetCount, duplicateConflictCount: slugConflicts.length, availableUniqueNames: unique.length, sourceCounts, slugConflicts, greenGate, note: 'Catalog metadata only; this does not grant any media rights.' };

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Canonical exercises: ${selected.length}/${targetCount}`);
console.log(`Unique names available: ${unique.length}`);
console.log(`Duplicate slug conflicts: ${slugConflicts.length}`);
console.log(`GREEN gate: ${greenGate ? 'YES' : 'NO'}`);
