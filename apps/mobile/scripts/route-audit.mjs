import fs from 'node:fs';
import path from 'node:path';

const appDir = fs.existsSync(path.resolve(process.cwd(), 'app'))
  ? path.resolve(process.cwd(), 'app')
  : path.resolve(process.cwd(), 'apps/mobile/app');
const expected = [
  '/', '/auth', '/onboarding', '/assistant', '/daily', '/meals', '/meal-builder', '/smart-meals', '/recipe-library', '/recipe-match',
  '/inventory', '/shopping', '/habits', '/supplements', '/reminders', '/calendar', '/notifications',
  '/insights', '/brain-overview', '/language', '/fitness', '/gym', '/calisthenics', '/yoga',
  '/exercise', '/meal/[id]', '/recipe/[id]',
];

function routeToPath(route) {
  if (route === '/') return path.join(appDir, 'index.tsx');
  return path.join(appDir, `${route.slice(1)}.tsx`);
}

function normalizeDiscoveredRoute(route) {
  const clean = route.replace(/\/$/, '') || '/';
  if (clean === '/meal') return '/meal/[id]';
  if (clean === '/recipe') return '/recipe/[id]';
  return clean;
}

const entries = fs.readdirSync(appDir, { withFileTypes: true });
const missing = expected.filter((route) => !fs.existsSync(routeToPath(route)));
const routePattern = /(?:router\.(?:push|replace)|href=)(?:\(\s*)?[`'\"](\/[^`'\"?$#}]*)/g;
const discovered = new Set();
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.tsx')) continue;
  const source = fs.readFileSync(path.join(appDir, entry.name), 'utf8');
  for (const match of source.matchAll(routePattern)) discovered.add(normalizeDiscoveredRoute(match[1]));
}
const unknownLinks = [...discovered].filter((route) => !expected.includes(route));

if (missing.length || unknownLinks.length) {
  console.error('ROUTE_AUDIT_FAIL');
  if (missing.length) console.error(`Missing routes: ${missing.join(', ')}`);
  if (unknownLinks.length) console.error(`Unknown static navigation routes: ${unknownLinks.join(', ')}`);
  process.exit(2);
}

console.log(`ROUTE_AUDIT_PASS routes=${expected.length} staticLinks=${discovered.size}`);
