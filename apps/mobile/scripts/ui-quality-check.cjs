const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'app');
const componentsDir = path.join(root, 'components');
const libDir = path.join(root, 'lib');

const requiredFiles = [
  'components/PremiumGlow.tsx',
  'components/PremiumSurface.tsx',
  'components/PremiumResultCard.tsx',
  'components/AssistantVoiceOrb.tsx',
  'components/AssistantDock.tsx',
  'lib/premium-ui.ts',
  'lib/motion-components.tsx',
  'lib/use-reduced-motion.ts',
  'lib/i18n.ts',
  'app/_layout.tsx',
  'app/assistant-premium.tsx',
  'app/smart-meals-premium.tsx',
  'app/meal-detail-premium.tsx',
];

const premiumRouteAliases = [
  ['assistant.tsx', "export { default } from './assistant-premium';"],
  ['brain-overview.tsx', "export { default } from './brain-overview-premium';"],
  ['calendar.tsx', "export { default } from './calendar-premium';"],
  ['daily.tsx', "export { default } from './daily-premium';"],
  ['habits.tsx', "export { default } from './habits-premium';"],
  ['insights.tsx', "export { default } from './insights-premium';"],
  ['inventory.tsx', "export { default } from './inventory-premium';"],
  ['language.tsx', "export { default } from './language-premium';"],
  ['meal-builder.tsx', "export { default } from './meal-builder-premium';"],
  ['meals.tsx', "export { default } from './meals-premium';"],
  ['notifications.tsx', "export { default } from './notifications-premium';"],
  ['price-history.tsx', "export { default } from './price-history-premium';"],
  ['recipe-match.tsx', "export { default } from './recipe-match-premium';"],
  ['reminders.tsx', "export { default } from './reminders-premium';"],
  ['shopping.tsx', "export { default } from './shopping-premium';"],
  ['smart-meals.tsx', "export { default } from './smart-meals-premium';"],
  ['supplements.tsx', "export { default } from './supplements-premium';"],
  ['yoga.tsx', "export { default } from './yoga-premium';"],
];

const requiredTokens = [
  ['app/_layout.tsx', ['AssistantDock', 'PREMIUM.colors.canvas', 'ErrorBoundary']],
  ['app/command-center-v2.tsx', ['AssistantVoiceOrb', 'PremiumGlow', 'PREMIUM', 'rtl']],
  ['app/assistant-premium.tsx', ['AssistantVoiceOrb', 'startRecognition', 'speakAssistantText', 'PremiumGlow', 'PREMIUM']],
  ['app/smart-meals-premium.tsx', ['PremiumResultCard', 'buildSmartMealSuggestions', 'PremiumGlow', 'PREMIUM']],
  ['app/meal-detail-premium.tsx', ['PremiumResultCard', 'getMeals', 'PremiumGlow', 'PREMIUM']],
  ['components/AssistantVoiceOrb.tsx', ['listening', 'thinking', 'speaking', 'done']],
];

const failures = [];
const exists = (relative) => fs.existsSync(path.join(root, relative));

for (const file of requiredFiles) {
  if (!exists(file)) failures.push(`missing foundation: ${file}`);
}

for (const [file, expected] of premiumRouteAliases) {
  const full = path.join(appDir, file);
  if (!fs.existsSync(full)) {
    failures.push(`missing route: app/${file}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(expected)) failures.push(`route is not wired to premium surface: app/${file}`);
}

const detailRoute = path.join(appDir, 'meal', '[id].tsx');
if (!fs.existsSync(detailRoute)) failures.push('missing route: app/meal/[id].tsx');
else if (!fs.readFileSync(detailRoute, 'utf8').includes("export { default } from '../meal-detail-premium';")) failures.push('meal detail is not wired to premium surface');

for (const [relative, tokens] of requiredTokens) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    failures.push(`missing token source: ${relative}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`missing ${token} in ${relative}`);
  }
}

const componentFiles = fs.readdirSync(componentsDir).filter((name) => name.endsWith('.tsx'));
const libFiles = fs.readdirSync(libDir).filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'));
if (!componentFiles.includes('PremiumResultCard.tsx')) failures.push('PremiumResultCard is not present in component library');
if (!libFiles.includes('premium-ui.ts')) failures.push('premium-ui token contract is not present in lib');

if (failures.length) {
  console.error(`UI QUALITY CONTRACT FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('UI QUALITY CONTRACT PASS: premium foundations, route wiring, voice states, RTL hooks and shared motion surfaces are present.');
