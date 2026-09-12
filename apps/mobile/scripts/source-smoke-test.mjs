import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname, '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const api = await readFile(resolve(root, 'lib/api.ts'), 'utf8');
const assistant = await readFile(resolve(root, 'app/assistant.tsx'), 'utf8');
const layout = await readFile(resolve(root, 'app/_layout.tsx'), 'utf8');
const i18n = await readFile(resolve(root, 'lib/i18n.ts'), 'utf8');
const localizedRoutes = [
  'daily.tsx', 'habits.tsx', 'inventory.tsx', 'insights.tsx', 'meals.tsx',
  'meal-builder.tsx', 'shopping.tsx', 'smart-meals.tsx', 'recipe-match.tsx',
  'supplements.tsx', 'yoga.tsx',
];
const routeSources = await Promise.all(localizedRoutes.map(async (file) => [file, await readFile(resolve(root, 'app', file), 'utf8')]));

const checks = [
  ['typecheck script exists', typeof pkg.scripts?.typecheck === 'string'],
  ['test script exists', typeof pkg.scripts?.test === 'string'],
  ['secure store dependency declared', Boolean(pkg.dependencies?.['expo-secure-store'])],
  ['speech dependency declared', Boolean(pkg.dependencies?.['expo-speech'])],
  ['api uses SecureStore', api.includes("from 'expo-secure-store'")],
  ['assistant exposes TTS action', assistant.includes('speakAssistantText') && assistant.includes('🔊')],
  ['notification runtime starts from app lifecycle', layout.includes('startNotificationRuntime') && layout.includes('registerForPushNotifications')],
  ['shared i18n exports locale hook', i18n.includes('export function useAppLocale')],
  ...routeSources.map(([file, source]) => [
    `${file} uses localization contract`, source.includes("from '../lib/i18n'") || source.includes("from '../../lib/i18n'") || source.includes('useAppLocale'),
  ]),
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`Mobile source smoke test passed (${checks.length} checks).`);