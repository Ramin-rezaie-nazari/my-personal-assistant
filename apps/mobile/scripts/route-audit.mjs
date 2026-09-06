import fs from 'node:fs';
import path from 'node:path';

const appDir = path.resolve(process.cwd(), 'apps/mobile/app');
const expected = [
  '/', '/assistant', '/daily', '/meals', '/meal-builder', '/smart-meals', '/recipe-library', '/recipe-match',
  '/inventory', '/shopping', '/habits', '/supplements', '/reminders', '/calendar', '/notifications',
  '/insights', '/brain-overview', '/language', '/fitness', '/gym', '/calisthenics', '/yoga', '/exercise',
];

function routeToPath(route) {
  if (route === '/') return path.join(appDir, 'index.tsx');
  return path.join(appDir, `${route.slice(1)}.tsx`);
}

const files = fs.readdirSync(appDir, { withFileTypes: true });
const missing = expected.filter((route) => !fs.existsSync(routeToPath(route)));
const nonRouteEntries = files.filter((entry) => entry.isFile() && entry.name.endsWith('.tsx') === false && entry.name !== '_layout.tsx');

const routePattern = /(?:router\.(?:push|replace)|href=)(?:\(\s*)?[`'\"](\/[^`'\"?$#}]*)/g;
const discovered = new Set();
for (const entry of files) {
  if (!entry.isFile() || !entry.name.endsWith('.tsx')) continue;
  const source = fs.readFileSync(path.join(appDir, entry.name), 'utf8');
  for (const match of source.matchAll(routePattern)) {
    const route = match[1].replace(/\/$/, '') || '/';
    discovered.add(route);
  }
}
const unknownLinks = [...discovered].filter((route) => !expected.includes(route));

if (missing.length || unknownLinks.length) {
  console.error('ROUTE_AUDIT_FAIL');
  if (missing.length) console.error(`Missing routes: ${missing.join(', ')}`);
  if (unknownLinks.length) console.error(`Unknown static navigation routes: ${unknownLinks.join(', ')}`);
  process.exit(2);
}

console.log(`ROUTE_AUDIT_PASS routes=${expected.length} staticLinks=${discovered.size}`);
