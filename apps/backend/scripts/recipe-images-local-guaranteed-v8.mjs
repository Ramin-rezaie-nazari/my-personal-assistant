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
  RECIPE_LOCAL_AUDIT_EXISTING: '0',
  RECIPE_LOCAL_MAX_IMAGES: process.env.RECIPE_LOCAL_MAX_IMAGES || '4',
  RECIPE_LOCAL_GALLERY_CONCURRENCY: process.env.RECIPE_LOCAL_GALLERY_CONCURRENCY || '4',
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
      'parallel local audit only when requested',
      'exact public Epicurious dataset mapping first, stored locally',
      'strict multi-source web fallback with local manifest/cache',
      'verified 1-4 image gallery upgrade from the verified recipe page',
      'final local status',
    ],
  }, null, 2));

  // The dataset stage creates exact local matches before any search engine is touched.
  await run('exact-local-dataset', './scripts/recipe-images-local-guaranteed-v7.mjs');

  // The strict resolver handles only recipes that still have no locally verified image.
  // Disable its own audit here because the v8 pipeline already has explicit local stages.
  await run(
    'strict-verified-web-resolution',
    './scripts/recipe-images-local-strict-v3.mjs',
    { RECIPE_LOCAL_AUDIT_EXISTING: '0' },
    true,
  );

  // Any verified web page can contribute up to four images; exact dataset-only rows safely keep one.
  await run(
    'verified-gallery-upgrade',
    './scripts/recipe-images-local-gallery-upgrade-v1.mjs',
    { RECIPE_LOCAL_MAX_IMAGES: env.RECIPE_LOCAL_MAX_IMAGES },
    true,
  );

  await run('final-status', './scripts/recipe-images-local-status.mjs', {}, false);
  console.log('\nPIPELINE COMPLETE');
}

main().catch((error) => {
  console.error(`\nPIPELINE FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
