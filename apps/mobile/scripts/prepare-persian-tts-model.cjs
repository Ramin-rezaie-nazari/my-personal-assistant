const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const modelDirName = 'vits-piper-fa_IR-ganji-medium';
const modelDir = path.join(assetsDir, modelDirName);
const archivePath = path.join(os.tmpdir(), `${modelDirName}.tar.bz2`);
const url = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fa_IR-ganji-medium.tar.bz2';

function required(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required Persian TTS asset: ${filePath}`);
  }
}

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

fs.mkdirSync(assetsDir, { recursive: true });

const requiredFiles = [
  path.join(modelDir, 'fa_IR-ganji-medium.onnx'),
  path.join(modelDir, 'tokens.txt'),
  path.join(modelDir, 'espeak-ng-data'),
];

if (requiredFiles.every((filePath) => fs.existsSync(filePath))) {
  console.log(`[MYPA] Persian TTS assets already prepared at ${modelDir}`);
  process.exit(0);
}

if (fs.existsSync(modelDir)) fs.rmSync(modelDir, { recursive: true, force: true });
if (fs.existsSync(archivePath)) fs.rmSync(archivePath, { force: true });

console.log('[MYPA] Downloading official Sherpa-ONNX Persian Piper model bundle...');
run('curl', ['-L', '--fail', '--retry', '3', '--retry-all-errors', '-o', archivePath, url]);

console.log('[MYPA] Extracting model bundle into Android assets...');
run('tar', ['-xjf', archivePath, '-C', assetsDir]);

for (const filePath of requiredFiles) required(filePath);
fs.rmSync(archivePath, { force: true });
console.log('[MYPA] Persian TTS assets are ready.');
