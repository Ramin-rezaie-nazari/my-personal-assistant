import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname, '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const api = await readFile(resolve(root, 'lib/api.ts'), 'utf8');
const assistant = await readFile(resolve(root, 'app/assistant.tsx'), 'utf8');

const checks = [
  ['typecheck script exists', typeof pkg.scripts?.typecheck === 'string'],
  ['secure store dependency declared', Boolean(pkg.dependencies?.['expo-secure-store'])],
  ['speech dependency declared', Boolean(pkg.dependencies?.['expo-speech'])],
  ['api uses SecureStore', api.includes("from 'expo-secure-store'")],
  ['assistant exposes TTS action', assistant.includes('speakAssistantText') && assistant.includes('🔊')],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`Mobile source smoke test passed (${checks.length} checks).`);
