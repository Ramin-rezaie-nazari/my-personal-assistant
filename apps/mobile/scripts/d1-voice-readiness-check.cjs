const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json'));
const assistant = read('app/assistant-premium.tsx');
const assistantApi = read('lib/assistant-api.ts');
const speech = read('lib/speech-recognition.ts');
const voice = read('lib/voice.ts');
const languages = read('lib/voice-language.ts');

function assert(condition, message) {
  if (!condition) throw new Error(`D1 VOICE READINESS FAILED: ${message}`);
}

const recognitionPlugin = appJson.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-speech-recognition');

assert(packageJson.dependencies?.['expo-speech-recognition'], 'expo-speech-recognition dependency missing');
assert(packageJson.dependencies?.['expo-speech'], 'expo-speech dependency missing');
assert(appJson.expo.android?.permissions?.includes('android.permission.RECORD_AUDIO'), 'Android RECORD_AUDIO permission missing');
assert(recognitionPlugin, 'expo-speech-recognition config plugin missing');
assert(recognitionPlugin[1]?.microphonePermission, 'microphone permission copy missing');
assert(recognitionPlugin[1]?.speechRecognitionPermission, 'speech-recognition permission copy missing');
assert(assistant.includes('getVoiceProfileForLocale(storedVoice.id, normalizeLocale(activeLocale))'), 'stored voice is not rebound to active locale');
assert(assistant.includes('getVoiceProfileForLocale(next.id, normalizeLocale(locale))'), 'selected voice is not rebound to active locale');
assert(assistant.includes('startRecognition(normalizeLocale(locale)'), 'recognition does not use active normalized locale');
assert(assistant.includes('speakAssistantText(response.message, voice)'), 'assistant TTS path is missing');
assert(assistant.includes("setVoiceState('acting')"), 'acting state transition is missing');
assert(assistant.includes("setVoiceState('speaking')"), 'speaking state transition is missing');
assert(assistant.includes("setVoiceState('done')"), 'done state transition is missing');
assert(assistant.includes('stopAssistantSpeech()'), 'assistant speech cleanup is missing');
assert(assistantApi.includes("import { getStoredLocale, normalizeLocale } from './i18n';"), 'assistant API must use the app locale source of truth');
assert(assistantApi.includes('const preferredLocale = locale ?? (storedLocale ? normalizeLocale(storedLocale) : \'en-US\');'), 'assistant locale fallback wiring is missing');
assert(assistantApi.includes('locale: preferredLocale'), 'assistant locale is not propagated to the backend');
assert(speech.includes('requestPermissionsAsync()'), 'microphone/speech permission request missing');
assert(speech.includes('contextualStrings: getSpeechContextualTerms(locale)'), 'locale-aware speech context missing');
assert(speech.includes('requiresOnDeviceRecognition: false'), 'D1 should not force on-device recognition for every locale');
assert(speech.includes('abort: () => void'), 'recognition handle must expose explicit abort');
assert(speech.includes('const abort = () =>'), 'recognition abort implementation is missing');
assert(speech.includes('ExpoSpeechRecognitionModule.abort()'), 'native recognizer abort is missing');
assert(speech.includes('requestPermissionsAsync();'), 'permission request must remain inside the guarded lifecycle');
assert(speech.includes('catch (error)'), 'permission/start failures must be guarded');
assert(speech.includes('let resultListener:') && speech.includes('resultListener?.remove();'), 'recognition result listener cleanup missing');
assert(speech.includes('let endListener:') && speech.includes('endListener?.remove();'), 'recognition end listener cleanup missing');
assert(speech.includes('let errorListener:') && speech.includes('errorListener?.remove();'), 'recognition error listener cleanup missing');
assert(voice.includes('language: profile.locale'), 'TTS locale is not passed to the speech provider');
assert(voice.includes('onError: () => resolve()') || voice.includes('onError: finish'), 'TTS failure cannot safely complete the promise');
const localeTable = languages.slice(languages.indexOf('export const VOICE_LANGUAGES'), languages.indexOf('export function getVoiceLanguage'));
const localeCount = (localeTable.match(/\['[a-z]{2,3}(?:-[A-Z]{2}|-[A-Z][a-z]{2})',/g) || []).length;
assert(localeCount >= 51, `expected at least 51 registered voice locales, found ${localeCount}`);

console.log('D1 VOICE READINESS CONTRACT PASS: permissions, Expo voice wiring, active-locale STT/TTS binding, assistant locale propagation, state transitions, provider fallback and abort-safe listener cleanup are present.');