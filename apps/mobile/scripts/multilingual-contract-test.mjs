import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (relative) => readFile(join(root, relative), 'utf8');

const languages = await read('lib/languages.ts');
const runtimeTranslator = await read('lib/runtime-translator.ts');
const azBridge = await read('lib/az-language-bridge.ts');
const voiceLanguage = await read('lib/voice-language.ts');
const assistant = await read('app/assistant.tsx');
const sourceSmoke = await read('scripts/source-smoke-test.mjs');
const appFiles = await readdir(join(root, 'app'), { withFileTypes: true });

const supportedBlock = languages.match(/export type SupportedAppLocale[\s\S]*?;/)?.[0] ?? '';
const baseLocales = [...supportedBlock.matchAll(/'([a-z]{2})'/g)].map((match) => match[1]);
const expected = 51;

const checks = [
  ['51 canonical base locales', baseLocales.length === expected],
  ['Iranian Azerbaijani Turkish is separate', /RegionalAppLocale\s*=\s*'az'/.test(languages) && /code:\s*'tr'.*Turkish \(Türkiye\)/s.test(languages)],
  ['language options include regional az', /LANGUAGE_OPTIONS\s*=/.test(languages) && /code:\s*'az'.*Azerbaijani Turkish \(Iran\)/s.test(languages)],
  ['voice mapping includes every base locale', baseLocales.every((code) => new RegExp(`\\b${code}:\\s*'[^']+'`).test(voiceLanguage))],
  ['voice mapping includes az', /\baz:\s*'az-AZ'/.test(voiceLanguage)],
  ['bidirectional translation gateway exists', runtimeTranslator.includes('translateTextBetweenLocales') && runtimeTranslator.includes("translateRecord(targetCode(sourceLocale), targetCode(targetLocale)")],
  ['Azerbaijani target bridges through Turkish', runtimeTranslator.includes("if (targetLangCode === 'az')") && runtimeTranslator.includes("translateRecordNative(sourceLangCode, 'tr', source)")],
  ['Azerbaijani source bridges through Turkish', runtimeTranslator.includes("if (sourceLangCode === 'az')") && runtimeTranslator.includes("translateRecordNative('tr', targetLangCode, normalizedTurkish)")],
  ['Iranian Azerbaijani lexical bridge exists', azBridge.includes('turkishToIranianAzerbaijani') && azBridge.includes('iranianAzerbaijaniToTurkish')],
  ['assistant canonicalizes input', assistant.includes("translateTextBetweenLocales(text, locale, 'en')")],
  ['assistant localizes output', assistant.includes('localizeAssistantText(response.message, locale)')],
  ['assistant TTS follows locale', assistant.includes('speakAssistantText(message.text, locale)')],
  ['source smoke test remains wired', sourceSmoke.includes('Mobile source smoke test passed')],
];

for (const entry of appFiles) {
  if (!entry.isFile() || !entry.name.endsWith('.tsx')) continue;
  if (['_layout.tsx', 'index.tsx', 'command-center.tsx'].includes(entry.name)) continue;
  const source = await readFile(join(root, 'app', entry.name), 'utf8');
  const localized = source.includes('localizedCopy') || source.includes('useAppLocale') || source.includes("from '../lib/i18n'") || source.includes("from '../lib/languages'");
  checks.push([`${entry.name} exposes the locale contract`, localized]);
}

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`Multilingual contract smoke test passed (${checks.length} checks).`);
