import http from 'node:http';
import { spawn } from 'node:child_process';

const REAL_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const PIPELINE = new URL('./recipe-images-local-mac-pipeline.mjs', import.meta.url);

if (!REAL_URL || !KEY) {
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
  // New Supabase secret keys are API keys, not JWT bearer tokens.
  // The existing local pipeline sends its configured key as both `apikey`
  // and `Authorization: Bearer ...`. This localhost proxy removes the
  // bearer header before forwarding requests, while preserving the key
  // as the upstream `apikey` header.
  const target = new URL(REAL_URL);

  const server = http.createServer((req, res) => {
    const upstream = new URL(req.url || '/', target);
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.authorization;
    headers.apikey = KEY;
    headers['user-agent'] = headers['user-agent'] || 'MYPA-local-mac-recipe-pipeline';

    const request = http.request(
      upstream,
      {
        method: req.method,
        headers,
      },
      (response) => {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
      },
    );

    request.on('error', (error) => {
      res.statusCode = 502;
      res.end(`Supabase proxy error: ${error.message}`);
    });
    req.pipe(request);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  if (!port) throw new Error('Failed to start local Supabase compatibility proxy.');

  const childEnv = {
    ...process.env,
    SUPABASE_URL: `http://127.0.0.1:${port}`,
    // The proxy owns the secret key; the child receives only a marker so the
    // pipeline can build its existing auth headers without exposing the real
    // key outside this process. The proxy replaces the upstream apikey value.
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_local_proxy_marker',
  };

  console.log('[MYPA] Supabase key mode: new secret key (API key).');
  console.log('[MYPA] Using localhost compatibility proxy; Authorization bearer header will NOT be sent upstream.');

  const child = spawn(process.execPath, [PIPELINE], {
    stdio: 'inherit',
    env: childEnv,
  });

  const cleanup = () => {
    try { server.close(); } catch {}
  };
  child.on('exit', (code, signal) => {
    cleanup();
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
