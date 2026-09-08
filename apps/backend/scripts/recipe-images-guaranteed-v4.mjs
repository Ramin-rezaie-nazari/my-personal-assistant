import { spawn } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();
const steps = [
  {
    name: 'repair-source-mapping',
    script: './scripts/recipe-source-mapping-repair.mjs',
    env: {},
  },
  {
    name: 'import-exact-dataset-images',
    script: './scripts/recipe-image-dataset-import-v2.mjs',
    env: {
      RECIPE_IMAGE_RESET: '0',
      RECIPE_IMAGE_CONCURRENCY: process.env.RECIPE_IMAGE_CONCURRENCY || '4',
    },
  },
  {
    name: 'strict-verified-web-resolution',
    script: './scripts/recipe-images-local-strict-v3.mjs',
    env: {
      RECIPE_LOCAL_CONCURRENCY: process.env.RECIPE_LOCAL_CONCURRENCY || '4',
      RECIPE_LOCAL_DELAY_MS: process.env.RECIPE_LOCAL_DELAY_MS || '450',
      RECIPE_LOCAL_LIMIT: process.env.RECIPE_LOCAL_LIMIT || '0',
      RECIPE_LOCAL_FORCE: process.env.RECIPE_LOCAL_FORCE || '0',
      RECIPE_LOCAL_AUDIT_EXISTING: '1',
    },
  },
  {
    name: 'final-status',
    script: './scripts/recipe-images-local-status.mjs',
    env: {},
  },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`\n========== ${step.name} ==========`);
    const child = spawn(process.execPath, [step.script], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...step.env },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`${step.name} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`));
    });
  });
}

async function main() {
  console.log(JSON.stringify({
    pipeline: 'recipe-images-guaranteed-v4',
    strategy: [
      'repair exact recipe-to-image source mapping',
      'import exact mapped dataset images first',
      'strictly verify existing local images and remove invalid provenance',
      'resolve remaining recipes only through title-verified source pages / image search',
      'print final status',
    ],
  }, null, 2));

  for (const step of steps) await runStep(step);
  console.log('\nPIPELINE COMPLETE');
}

main().catch((error) => {
  console.error(`\nPIPELINE FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
