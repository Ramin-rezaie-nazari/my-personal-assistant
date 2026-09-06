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

const missing = expected.filter((route) => !fs.existsSync(routeToPath(route)));
const duplicates = new Map();
for (const file of fs.readdirSync(appDir)) {
  if (file.endsWith('.tsx')) duplicates.set(file, (duplicates.get(file) ?? 0) + 1);
}
const duplicateFiles = [...duplicates.entries()].filter(([, count]) => count > 1);

if (missing.length || duplicateFiles.length) {
  console.error('ROUTE_AUDIT_FAIL');
  if (missing.length) console.error(`Missing routes: ${missing.join(', ')}`);
  if (duplicateFiles.length) console.error(`Duplicate route files: ${duplicateFiles.map(([name]) => name).join(', ')}`);
  process.exit(2);
}

console.log(`ROUTE_AUDIT_PASS routes=${expected.length}`);
