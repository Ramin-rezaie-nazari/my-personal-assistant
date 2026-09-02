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
  kamteraFemaleModel: path.join(assetsDir, 'vits-coqui-fa-iran-female', 'model.onnx'),
  kamteraFemaleTokens: path.join(assetsDir, 'vits-coqui-fa-iran-female', 'tokens.txt'),
  kamteraMaleModel: path.join(assetsDir, 'vits-coqui-fa-iran-male', 'model.onnx'),
  kamteraMaleTokens: path.join(assetsDir, 'vits-coqui-fa-iran-male', 'tokens.txt'),
};

for (const [name, filePath] of Object.entries(files)) {
  if (!fs.existsSync(filePath)) {
    console.error(`ANDROID TTS PREFLIGHT FAILED: missing ${name}: ${filePath}`);
    process.exit(1);
  }
}

const sizes = Object.fromEntries(Object.entries(files).map(([name, filePath]) => [name, fs.statSync(filePath).size]));
for (const [name, min] of Object.entries({ khadijahModel: 50_000_000, khadijahVocoder: 40_000_000, ganjiModel: 1_000_000, kamteraFemaleModel: 10_000_000, kamteraMaleModel: 10_000_000 })) {
  if (sizes[name] < min) {
    console.error(`ANDROID TTS PREFLIGHT FAILED: ${name} is too small (${sizes[name]})`);
    process.exit(1);
  }
}

console.log('ANDROID TTS PREFLIGHT PASS');
console.log(JSON.stringify(sizes));
