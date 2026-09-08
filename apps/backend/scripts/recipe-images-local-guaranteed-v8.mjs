import { spawn } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const env = {
  RECIPE_LOCAL_ROOT: process.env.RECIPE_LOCAL_ROOT || path.resolve('./data/mypa-recipe-media-local'),
  RECIPE_LOCAL_CATALOG: process.env.RECIPE_LOCAL_CATALOG || path.resolve('./data/mypa-recipe-media/recipe-catalog.jsonl'),
  RECIPE_LOCAL_CONCURRENCY: process.env.RECIPE_LOCAL_CONCURRENCY || '4',
  RECIPE_LOCAL_DELAY_MS: process.env.RECIPE_LOCAL_DELAY_MS || '650',
  RECIPE_LOCAL_LIMIT: process.env.RECIPE_LOCAL_LIMIT || '0',
  RECIPE_LOCAL_FORCE: '0',
  RECIPE_LOCAL_MAX_IMAGES: process.env.RECIPE_LOCAL_MAX_IMAGES || '4',
  RECIPE_LOCAL_GALLERY_CONCURRENCY: process.env.RECIPE_LOCAL_GALLERY_CONCURRENCY || '4',
  RECIPE_LOCAL_AUDIT_TIMEOUT_MS: process.env.RECIPE_LOCAL_AUDIT_TIMEOUT_MS || '3500',
  RECIPE_LOCAL_AUDIT_CONCURRENCY: process.env.RECIPE_LOCAL_AUDIT_CONCURRENCY || '12',
};

function run(label, script, extra = {}, allowFailure = false) {
  console.log(`\n========== ${label} ==========`);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...env, ...extra },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0 || allowFailure) return resolve();
      reject(new Error(`${label} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`));
    });
  });
}

async function main() {
  console.log(JSON.stringify({
    pipeline: 'recipe-images-local-guaranteed-v8',
    supabase: 'DISABLED',
    target: '1-4 verified images per recipe',
    strategy: [
      'parallel provenance audit of all existing local images',
      'exact public Epicurious dataset mapping first, stored locally',
      'strict multi-source web fallback for remaining recipes',
      'verified 1-4 image gallery upgrade from verified recipe pages',
      'final local status',
    ],
  }, null, 2));

  // First remove/flag old unverified local rows. This prevents legacy false-positives
  // from blocking the exact dataset stage.
  await run('audit-existing-local', './scripts/recipe-images-local-audit-v4.mjs');

  // Highest-confidence source: the public Epicurious-derived dataset contains a
  // title -> Image_Name mapping. The whole dataset is downloaded and extracted locally.
  await run('exact-local-dataset', './scripts/recipe-images-local-guaranteed-v7.mjs');

  // Only recipes still missing a verified local image reach this stage.
  // Search-engine failures are recorded locally so later reruns can retry them.
  await run(
    'strict-verified-web-resolution',
    './scripts/recipe-images-local-strict-v3.mjs',
    { RECIPE_LOCAL_AUDIT_EXISTING: '0' },
    true,
  );

  // Recipes that have a verified web page can get 1-4 images from that same page.
  // Exact dataset-only rows safely remain at one image when no canonical page is known.
  await run(
    'verified-gallery-upgrade',
    './scripts/recipe-images-local-gallery-upgrade-v1.mjs',
    { RECIPE_LOCAL_MAX_IMAGES: env.RECIPE_LOCAL_MAX_IMAGES },
    true,
  );

  await run('final-status', './scripts/recipe-images-local-status.mjs');
  console.log('\nPIPELINE COMPLETE');
}

main().catch((error) => {
  console.error(`\nPIPELINE FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
