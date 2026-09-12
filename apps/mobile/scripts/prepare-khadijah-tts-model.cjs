const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const modelDirName = 'matcha-tts-fa_en-khadijah';
const modelDir = path.join(assetsDir, modelDirName);
const modelRevision = '9517174';
const modelUrl = `https://huggingface.co/csukuangfj/matcha-tts-fa_en-khadijah/resolve/${modelRevision}/model.onnx`;
const tokensUrl = `https://huggingface.co/csukuangfj/matcha-tts-fa_en-khadijah/resolve/${modelRevision}/tokens.txt`;
const vocoderRevision = '05ebbab';
const vocoderUrl = `https://huggingface.co/k2-fsa/sherpa-onnx-models/resolve/${vocoderRevision}/vocoder-models/vocos-22khz-univ.onnx`;
const expectedModelSha256 = 'f787627c08c782fc47b7d3a8131cfa25e58eb3a9de117a39723f36cab9c682bc';
const expectedVocoderSha256 = '0574a135aa1db2de6e181050db2ec528496cacd4a4701fc5d7faf9f9804c0081';
const existingPersianEspeakDir = path.join(assetsDir, 'vits-piper-fa_IR-ganji-medium', 'espeak-ng-data');
const vocoderPath = path.join(assetsDir, 'vocos-22khz-univ.onnx');

function run(command, args, options = {}) { execFileSync(command, args, { stdio: 'inherit', ...options }); }
function download(url, destination) { run('curl', ['-L', '--fail', '--retry', '3', '--retry-all-errors', '-o', destination, url]); }
function required(filePath) { if (!fs.existsSync(filePath)) throw new Error(`Missing required asset: ${filePath}`); }
function sha256(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}
function verifySha256(filePath, expected, label) {
  const actual = sha256(filePath);
  if (actual !== expected) throw new Error(`${label} SHA-256 mismatch: expected ${expected}, got ${actual}`);
  console.log(`[MYPA] Verified ${label} SHA-256: ${actual}`);
}
function ensureDownloaded(url, destination, expectedSha, label) {
  if (!fs.existsSync(destination)) {
    console.log(`[MYPA] Downloading ${label}...`);
    download(url, destination);
  } else console.log(`[MYPA] ${label} already exists; verifying integrity.`);
  verifySha256(destination, expectedSha, label);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(modelDir, { recursive: true });

const modelPath = path.join(modelDir, 'model.onnx');
const tokensPath = path.join(modelDir, 'tokens.txt');
const dataDir = path.join(modelDir, 'espeak-ng-data');

ensureDownloaded(modelUrl, modelPath, expectedModelSha256, 'Khadijah acoustic model');

if (!fs.existsSync(tokensPath)) {
  console.log('[MYPA] Downloading Khadijah Persian/English tokens...');
  download(tokensUrl, tokensPath);
} else console.log('[MYPA] Khadijah tokens already exist.');

if (!fs.existsSync(dataDir)) {
  if (!fs.existsSync(existingPersianEspeakDir)) throw new Error(`Persian espeak-ng-data not found at ${existingPersianEspeakDir}. Run prepare-persian-tts-model.cjs first.`);
  console.log('[MYPA] Reusing bundled Persian espeak-ng-data for Khadijah...');
  fs.cpSync(existingPersianEspeakDir, dataDir, { recursive: true });
}

ensureDownloaded(vocoderUrl, vocoderPath, expectedVocoderSha256, 'Shared Vocos 22kHz universal vocoder');

required(modelPath);
required(tokensPath);
required(path.join(dataDir, 'phontab'));
required(path.join(dataDir, 'phonindex'));
required(vocoderPath);

console.log(`[MYPA] Khadijah Matcha assets are ready at ${modelDir}`);
console.log(`[MYPA] Shared vocoder is ready at ${vocoderPath}`);
