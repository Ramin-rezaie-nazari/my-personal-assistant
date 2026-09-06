import fs from 'node:fs';
import path from 'node:path';

const appDir = path.resolve(process.cwd(), 'apps/mobile/app');
const libDir = path.resolve(process.cwd(), 'apps/mobile/lib');
const failures = [];

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) result.push(full);
  }
  return result;
}

function routeFromFile(file) {
  const relative = path.relative(appDir, file).replaceAll(path.sep, '/');
  if (!/^.+\.(tsx?|jsx?)$/.test(relative)) return null;
  let route = relative.replace(/\.(tsx?|jsx?)$/, '');
  if (route === 'index') return '/';
  route = route.replace(/\/index$/, '');
  route = route.replace(/\[\.\.\.([\w-]+)\]/g, ':$1*');
  route = route.replace(/\[([\w-]+)\]/g, ':$1');
  route = route.split('/').filter((segment) => segment && !segment.startsWith('(')).join('/');
  return `/${route}`;
}

const routeFiles = walk(appDir);
const routes = new Set(routeFiles.map(routeFromFile).filter(Boolean));
const required = [
  '/', '/auth', '/onboarding', '/assistant', '/daily', '/meals', '/meal-builder', '/smart-meals',
  '/recipe-library', '/recipe-match', '/recipe/:id', '/inventory', '/shopping', '/habits', '/supplements',
  '/reminders', '/calendar', '/notifications', '/insights', '/brain-overview', '/language', '/fitness',
  '/gym', '/calisthenics', '/yoga', '/exercise', '/fitness-session',
];
for (const route of required) {
  if (!routes.has(route)) failures.push(`Missing app route: ${route}`);
}

const sourceFiles = [...walk(appDir), ...walk(libDir)].filter((file) => !file.endsWith('surface-audit.mjs'));
const directLocalhost = [];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes("http://localhost:3000") && !file.endsWith('api-base.ts')) {
    directLocalhost.push(path.relative(process.cwd(), file));
  }
}
if (directLocalhost.length) failures.push(`Direct localhost API URLs outside api-base.ts: ${directLocalhost.join(', ')}`);

const routerTargets = new Set();
for (const file of routeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/router\.(?:push|replace)\(\s*['"](\/[^'"?}]+)/g)) routerTargets.add(match[1]);
  for (const match of source.matchAll(/pathname\s*:\s*['"](\/[^'"?}]+)/g)) routerTargets.add(match[1]);
}
function matchesTarget(target) {
  if (routes.has(target)) return true;
  return [...routes].some((route) => {
    const pattern = route.replace(/:[^/]+\*/g, '.*').replace(/:[^/]+/g, '[^/]+');
    return new RegExp(`^${pattern}$`).test(target);
  });
}
for (const target of routerTargets) {
  if (!matchesTarget(target)) failures.push(`Router target has no matching Expo route: ${target}`);
}

if (failures.length) {
  console.error('MOBILE_SURFACE_AUDIT_FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(2);
}
console.log(`MOBILE_SURFACE_AUDIT_PASS routes=${routes.size} routerTargets=${routerTargets.size} apiHost=centralized`);
