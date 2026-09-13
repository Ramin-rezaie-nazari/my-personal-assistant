import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), '../..');
const catalogDir = resolve(root, 'data/mypa-sports-catalog-expanded');
const expectedTotal = process.env.FITNESS_EXPECTED_TOTAL
  ? Number(process.env.FITNESS_EXPECTED_TOTAL)
  : null;

async function readJson(name) {
  return JSON.parse(await readFile(resolve(catalogDir, name), 'utf8'));
}

const [strength, yoga] = await Promise.all([
  readJson('catalog-summary.json'),
  readJson('yoga-catalog-summary.json'),
]);

const normalizedStrength = Number(strength.normalizedCount ?? 0);
const normalizedYoga = Number(yoga.normalizedCount ?? 0);
const total = normalizedStrength + normalizedYoga;
const disciplineTotal = Object.values(strength.bySport ?? {}).reduce(
  (sum, count) => sum + Number(count ?? 0),
  0,
);

if (disciplineTotal !== normalizedStrength) {
  throw new Error(
    `Strength summary mismatch: bySport=${disciplineTotal} normalizedCount=${normalizedStrength}`,
  );
}

if (total <= 0) {
  throw new Error('Sports catalog is empty');
}

if (expectedTotal !== null && (!Number.isInteger(expectedTotal) || expectedTotal <= 0)) {
  throw new Error(`FITNESS_EXPECTED_TOTAL must be a positive integer; got ${process.env.FITNESS_EXPECTED_TOTAL}`);
}

if (expectedTotal !== null && total !== expectedTotal) {
  throw new Error(
    `Sports catalog total mismatch: expected ${expectedTotal}, actual ${total}`,
  );
}

console.table({
  gym: Number(strength.bySport?.gym ?? 0),
  calisthenics: Number(strength.bySport?.calisthenics ?? 0),
  yoga: normalizedYoga,
  total,
  withInstructions: Number(strength.withInstructions ?? 0) + Number(yoga.withInstructions ?? 0),
  withImages: Number(strength.withImages ?? 0) + Number(yoga.withImages ?? 0),
});
