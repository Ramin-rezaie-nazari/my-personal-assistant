import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('apps/mobile');
const allowed = new Set([
  path.join(root, 'app', '_layout.tsx'),
  path.join(root, 'app', 'language.tsx'),
  path.join(root, 'app', 'assistant.tsx'),
  path.join(root, 'components', 'app-error-state.tsx'),
]);

function filesUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'android' || entry.name === 'ios') continue;
    if (entry.isDirectory()) out.push(...filesUnder(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const violations = [];
for (const file of filesUnder(path.join(root, 'app')).concat(filesUnder(path.join(root, 'components')))) {
  const normalized = path.normalize(file);
  if (allowed.has(normalized)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const checks = [
    ['route-local getStoredLocale()', /getStoredLocale\s*\(/],
    ['route-local locale state', /const\s*\[locale\s*,\s*setLocale\s*\]/],
    ['binary isFa state', /\b(?:const|let)\s+isFa\s*=\s*locale\s*===\s*['"]fa['"]/],
    ['binary locale UI branch', /locale\s*===\s*['"]fa['"]\s*\?/],
    ['binary RTL text branch', /\brtl\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/],
  ];
  for (const [label, pattern] of checks) {
    const match = content.match(pattern);
    if (!match) continue;
    if (label === 'binary RTL text branch') {
      const [left, right] = match.slice(1, 3);
      if (!/[A-Za-z\u0600-\u06FF]/.test(left) && !/[A-Za-z\u0600-\u06FF]/.test(right)) continue;
    }
    violations.push(path.relative(process.cwd(), file) + ': ' + label);
  }
}

if (violations.length) {
  for (const violation of violations) console.error(violation);
  process.exitCode = 1;
}
