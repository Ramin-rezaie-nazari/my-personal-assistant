const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');

const files = {
  ganjiModel: path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'fa_IR-ganji-medium.onnx'),
  ganjiTokens: path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'tokens.txt'),
  ganjiPhontab: path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'espeak-ng-data', 'phontab'),
  ganjiPhonindex: path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'espeak-ng-data', 'phonindex'),
  khadijahModel: path.join(assetsDir, 'matcha-tts-fa_en-khadijah-v2', 'model.onnx'),
  khadijahTokens: path.join(assetsDir, 'matcha-tts-fa_en-khadijah-v2', 'tokens.txt'),
  khadijahVocoder: path.join(assetsDir, 'matcha-tts-fa_en-khadijah-v2', 'vocos-22khz-univ.onnx'),
  khadijahPhontab: path.join(assetsDir, 'matcha-tts-fa_en-khadijah-v2', 'espeak-ng-data', 'phontab'),
  khadijahPhonindex: path.join(assetsDir, 'matcha-tts-fa_en-khadijah-v2', 'espeak-ng-data', 'phonindex'),
};

for (const [name, filePath] of Object.entries(files)) {
  if (!fs.existsSync(filePath)) {
    console.error(`ANDROID TTS PREFLIGHT FAILED: missing ${name}: ${filePath}`);
    process.exit(1);
  }
}

const sizes = Object.fromEntries(Object.entries(files).map(([name, filePath]) => [name, fs.statSync(filePath).size]));
if (sizes.khadijahModel < 50_000_000) throw new Error(`ANDROID TTS PREFLIGHT FAILED: Khadijah model too small (${sizes.khadijahModel})`);
if (sizes.khadijahVocoder < 40_000_000) throw new Error(`ANDROID TTS PREFLIGHT FAILED: Khadijah vocoder too small (${sizes.khadijahVocoder})`);
if (sizes.ganjiModel < 1_000_000) throw new Error(`ANDROID TTS PREFLIGHT FAILED: Ganji model too small (${sizes.ganjiModel})`);

console.log('ANDROID TTS PREFLIGHT PASS');
console.log(JSON.stringify(sizes));
