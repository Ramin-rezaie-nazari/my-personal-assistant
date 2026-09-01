const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const modelDirName = 'matcha-tts-fa_en-khadijah-v2';
const legacyModelDir = path.join(assetsDir, 'matcha-tts-fa_en-khadijah');
const modelDir = path.join(assetsDir, modelDirName);
const modelUrl = 'https://huggingface.co/csukuangfj/matcha-tts-fa_en-khadijah/resolve/main/model.onnx';
const tokensUrl = 'https://huggingface.co/csukuangfj/matcha-tts-fa_en-khadijah/resolve/main/tokens.txt';
const vocoderUrl = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/vocoder-models/vocos-22khz-univ.onnx';
const existingPersianEspeakDir = path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'espeak-ng-data');

function run(command, args, options = {}) { execFileSync(command, args, { stdio: 'inherit', ...options }); }
function download(url, destination) { run('curl', ['-L', '--fail', '--retry', '3', '--retry-all-errors', '-o', destination, url]); }
function required(filePath) { if (!fs.existsSync(filePath)) throw new Error(`Missing required asset: ${filePath}`); }

fs.mkdirSync(assetsDir, { recursive: true });
if (fs.existsSync(legacyModelDir)) {
  console.log('[MYPA] Removing stale Khadijah v1 bundle...');
  fs.rmSync(legacyModelDir, { recursive: true, force: true });
}
fs.mkdirSync(modelDir, { recursive: true });

const modelPath = path.join(modelDir, 'model.onnx');
const tokensPath = path.join(modelDir, 'tokens.txt');
const dataDir = path.join(modelDir, 'espeak-ng-data');
const vocoderPath = path.join(modelDir, 'vocos-22khz-univ.onnx');

if (!fs.existsSync(modelPath)) { console.log('[MYPA] Downloading Matcha FA-EN Khadijah acoustic model...'); download(modelUrl, modelPath); }
if (!fs.existsSync(tokensPath)) { console.log('[MYPA] Downloading Khadijah Persian/English tokens...'); download(tokensUrl, tokensPath); }
if (!fs.existsSync(dataDir)) {
  required(existingPersianEspeakDir);
  console.log('[MYPA] Copying bundled Persian espeak-ng-data into Khadijah...');
  fs.cpSync(existingPersianEspeakDir, dataDir, { recursive: true });
}
if (!fs.existsSync(vocoderPath)) { console.log('[MYPA] Downloading shared Vocos 22kHz universal vocoder...'); download(vocoderUrl, vocoderPath); }

for (const filePath of [modelPath, tokensPath, vocoderPath, path.join(dataDir, 'phontab'), path.join(dataDir, 'phonindex')]) required(filePath);
const stat = (filePath) => fs.statSync(filePath).size;
const sizes = { model: stat(modelPath), tokens: stat(tokensPath), phontab: stat(path.join(dataDir, 'phontab')), phonindex: stat(path.join(dataDir, 'phonindex')), vocoder: stat(vocoderPath) };
if (sizes.model < 50_000_000) throw new Error(`Khadijah model appears incomplete: ${sizes.model} bytes`);
if (sizes.vocoder < 40_000_000) throw new Error(`Khadijah vocoder appears incomplete: ${sizes.vocoder} bytes`);
console.log('[MYPA] Khadijah asset sizes:', JSON.stringify(sizes));
console.log(`[MYPA] Khadijah Matcha assets are ready at ${modelDir}`);
