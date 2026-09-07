import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const PIPELINE = fileURLToPath(new URL('./recipe-images-local-mac-pipeline.mjs', import.meta.url));

if (!SUPABASE_URL || !KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

function keyMode(value) {
  if (value.startsWith('sb_secret_')) return 'secret';
  if (value.startsWith('sb_publishable_')) return 'publishable';
  if (value.startsWith('eyJ')) return 'legacy-jwt';
  return 'unknown';
}

const mode = keyMode(KEY);
if (mode === 'publishable') {
  throw new Error('A publishable key cannot access the recipe corpus. Use a Supabase Secret key (sb_secret_...) or legacy service_role JWT.');
}

if (mode !== 'secret') {
  const child = spawn(process.execPath, [PIPELINE], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
} else {
  // Supabase Secret keys are API keys, not JWT bearer tokens. The existing
  // pipeline sends its key as both `apikey` and `Authorization: Bearer ...`.
  // Patch fetch in the child process so the real Supabase URL is preserved
  // while the upstream request receives only the API-key form of auth.
  const authShim = [
    'const originalFetch = globalThis.fetch;',
    'globalThis.fetch = (input, init = {}) => {',
    '  const headers = new Headers(init.headers || {});',
    '  headers.delete("authorization");',
    '  headers.set("apikey", process.env.SUPABASE_SERVICE_ROLE_KEY);',
    '  return originalFetch(input, { ...init, headers });',
    '};',
  ].join('\n');
  const shim = `data:text/javascript,${encodeURIComponent(authShim)}`;

  console.log('[MYPA] Supabase key mode: new secret key (API key).');
  console.log('[MYPA] Using real Supabase URL; Authorization bearer header is stripped before each fetch.');

  const child = spawn(process.execPath, ['--import', shim, PIPELINE], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
