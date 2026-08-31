const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MODEL_DIR = 'vits-piper-fa_IR-ganji-medium';
const ASSET_ROOT = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');
const DEST_DIR = path.join(ASSET_ROOT, MODEL_DIR);
const ARCHIVE = path.join(ASSET_ROOT, `${MODEL_DIR}.tar.bz2`);
const URL = `https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/${MODEL_DIR}.tar.bz2`;

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error(`Missing or empty TTS asset: ${filePath}`);
  }
}

fs.mkdirSync(ASSET_ROOT, { recursive: true });

if (!fs.existsSync(DEST_DIR)) {
  console.log(`[MYPA][TTS] Downloading official Sherpa-ONNX model bundle: ${MODEL_DIR}`);
  run('curl', ['-fL', '--retry', '3', '--retry-all-errors', '-o', ARCHIVE, URL]);
  run('tar', ['-xjf', ARCHIVE, '-C', ASSET_ROOT]);
}

ensureFile(path.join(DEST_DIR, 'fa_IR-ganji-medium.onnx'));
ensureFile(path.join(DEST_DIR, 'tokens.txt'));
ensureFile(path.join(DEST_DIR, 'espeak-ng-data', 'phontab'));
ensureFile(path.join(DEST_DIR, 'espeak-ng-data', 'phonindex'));

if (fs.existsSync(ARCHIVE)) fs.rmSync(ARCHIVE, { force: true });

console.log(`[MYPA][TTS] Persian Piper assets ready: ${DEST_DIR}`);
