const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const modelDirName = 'matcha-tts-fa_en-khadijah';
const modelDir = path.join(assetsDir, modelDirName);
const modelUrl = 'https://huggingface.co/csukuangfj/matcha-tts-fa_en-khadijah/resolve/main/model.onnx';
const tokensUrl = 'https://huggingface.co/csukuangfj/matcha-tts-fa_en-khadijah/resolve/main/tokens.txt';
const vocoderUrl = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/vocoder-models/vocos-22khz-univ.onnx';
const existingPersianEspeakDir = path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'espeak-ng-data');
const vocoderPath = path.join(modelDir, 'vocos-22khz-univ.onnx');

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}
function download(url, destination) {
  run('curl', ['-L', '--fail', '--retry', '3', '--retry-all-errors', '-o', destination, url]);
}
function required(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required asset: ${filePath}`);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(modelDir, { recursive: true });

const modelPath = path.join(modelDir, 'model.onnx');
const tokensPath = path.join(modelDir, 'tokens.txt');
const dataDir = path.join(modelDir, 'espeak-ng-data');

if (!fs.existsSync(modelPath)) {
  console.log('[MYPA] Downloading Matcha FA-EN Khadijah acoustic model...');
  download(modelUrl, modelPath);
}
if (!fs.existsSync(tokensPath)) {
  console.log('[MYPA] Downloading Khadijah Persian/English tokens...');
  download(tokensUrl, tokensPath);
}

// Matcha models need their own pronunciation data. Do not rely on a second model
// bundle being extracted correctly at runtime.
if (!fs.existsSync(dataDir)) {
  if (!fs.existsSync(existingPersianEspeakDir)) {
    throw new Error(`Persian espeak-ng-data not found at ${existingPersianEspeakDir}. Run prepare-persian-tts-model.cjs first.`);
  }
  console.log('[MYPA] Copying bundled Persian espeak-ng-data into Khadijah...');
  fs.cpSync(existingPersianEspeakDir, dataDir, { recursive: true });
}

if (!fs.existsSync(vocoderPath)) {
  console.log('[MYPA] Downloading shared Vocos 22kHz universal vocoder...');
  download(vocoderUrl, vocoderPath);
}

for (const filePath of [
  modelPath,
  tokensPath,
  path.join(dataDir, 'phontab'),
  path.join(dataDir, 'phonindex'),
  vocoderPath,
]) required(filePath);

const stat = (filePath) => fs.statSync(filePath).size;
console.log('[MYPA] Khadijah asset sizes:', JSON.stringify({
  model: stat(modelPath),
  tokens: stat(tokensPath),
  phontab: stat(path.join(dataDir, 'phontab')),
  phonindex: stat(path.join(dataDir, 'phonindex')),
  vocoder: stat(vocoderPath),
}));
console.log(`[MYPA] Khadijah Matcha assets are ready at ${modelDir}`);
