const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const languageFile = fs.readFileSync(path.join(root, 'lib/voice-language.ts'), 'utf8');
const voiceFile = fs.readFileSync(path.join(root, 'lib/voice.ts'), 'utf8');
const speechFile = fs.readFileSync(path.join(root, 'lib/speech-recognition.ts'), 'utf8');

const expectedLocales = [
  'fa-IR','en-US','en-GB','es-ES','es-MX','fr-FR','de-DE','it-IT','pt-BR','pt-PT',
  'ru-RU','uk-UA','pl-PL','nl-NL','tr-TR','ar-SA','he-IL','hi-IN','bn-IN','ur-PK',
  'pa-IN','gu-IN','mr-IN','ta-IN','te-IN','ja-JP','ko-KR','zh-CN','zh-TW','vi-VN',
  'th-TH','id-ID','ms-MY','fil-PH','sv-SE','no-NO','da-DK','fi-FI','cs-CZ','sk-SK',
  'hu-HU','ro-RO','bg-BG','el-GR','sr-RS','hr-HR','sl-SI','sw-KE','am-ET','fa-AF','fa-TJ',
];

function assert(condition, message) {
  if (!condition) throw new Error(`VOICE QUALITY CHECK FAILED: ${message}`);
}

for (const locale of expectedLocales) {
  assert(languageFile.includes(`'${locale}'`), `missing locale ${locale}`);
}

const voiceProfileIds = ['venus','nila','roya','mahsa','darya','arman','shayan','rayan','kian','sina'];
for (const id of voiceProfileIds) {
  assert(voiceFile.includes(`id: '${id}'`), `missing voice profile ${id}`);
}

assert(voiceProfileIds.length === 10, 'expected exactly 10 selectable voice profiles');
assert((voiceFile.match(/gender: 'female'/g) || []).length === 5, 'expected 5 female voice profiles');
assert((voiceFile.match(/gender: 'male'/g) || []).length === 5, 'expected 5 male voice profiles');
assert(languageFile.includes('speechRecognitionLocale: code'), 'STT locale mapping is missing');
assert(languageFile.includes('ttsLocale: code'), 'TTS locale mapping is missing');
assert(voiceFile.includes('nativeStyle: language.code === \'fa-IR\' ? \'tehran\' : \'native\''), 'native voice-style policy is missing');
assert(voiceFile.includes('language: profile.locale'), 'TTS provider does not receive the selected locale');
assert(voiceFile.includes('onError: () => resolve()'), 'TTS error completion handler is not safe');
assert(speechFile.includes('getSpeechContextualTerms'), 'localized speech-context helper is missing');
assert(speechFile.includes("'de-DE'"), 'German contextual speech terms are missing');
assert(speechFile.includes("'ja-JP'"), 'Japanese contextual speech terms are missing');
assert(speechFile.includes("'zh-CN'"), 'Chinese contextual speech terms are missing');
assert(speechFile.includes('contextualStrings: getSpeechContextualTerms(locale)'), 'recognition does not route locale-aware contextual strings');

const rtlLocales = ['fa-IR','fa-AF','ar-SA','he-IL','ur-PK'];
for (const locale of rtlLocales) {
  assert(languageFile.includes(`['${locale}'`), `RTL locale ${locale} is not registered in the voice table`);
}

console.log(`VOICE QUALITY CONTRACT PASS: ${expectedLocales.length} locales, ${voiceProfileIds.length} voice profiles, STT/TTS mapping, localized speech context, RTL policy, Persian Tehran style and safe TTS completion.`);
