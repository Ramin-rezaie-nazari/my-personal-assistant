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
  RECIPE_LOCAL_AUDIT_EXISTING: process.env.RECIPE_LOCAL_AUDIT_EXISTING || '0',
  RECIPE_LOCAL_MAX_IMAGES: process.env.RECIPE_LOCAL_MAX_IMAGES || '4',
};

function run(label, script, extra = {}) {
  console.log(`\n========== ${label} ==========`);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...env, ...extra },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`${label} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`));
    });
  });
}

async function main() {
  console.log(JSON.stringify({
    pipeline: 'recipe-images-local-guaranteed-v8',
    supabase: 'DISABLED',
    target: 'verified local recipe images',
    strategy: [
      'run the maintained local guaranteed-v7 dataset resolver',
      'do not reference missing/untracked v8 child scripts',
      'keep v8 as a stable compatibility entrypoint until a maintained multi-stage resolver is introduced',
    ],
  }, null, 2));

  await run('maintained-local-dataset-resolution', './scripts/recipe-images-local-guaranteed-v7.mjs');
  console.log('\nPIPELINE COMPLETE');
}

main().catch((error) => {
  console.error(`\nPIPELINE FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
