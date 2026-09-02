const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const candidates = path.join(root, 'tts-candidates');
const outputs = path.join(root, 'tts-converted');
const androidAssets = path.join(root, 'android', 'app', 'src', 'main', 'assets');

function fail(message) {
  console.error(`KAMTERA PREP FAILED: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false, ...options });
  if (result.error) fail(`${command} failed to start: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} exited with ${result.status}`);
}

function pickPython() {
  for (const candidate of ['python3.11', 'python3.10', 'python3']) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (probe.status !== 0) continue;
    const match = `${probe.stdout || ''}${probe.stderr || ''}`.match(/Python (\d+)\.(\d+)/);
    if (!match) continue;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    if (major === 3 && minor >= 10 && minor <= 11) return candidate;
  }
  fail('Python 3.10 or 3.11 is required for Coqui TTS export. Python 3.14 is intentionally not used.');
}

function ensureVenv(python) {
  const venv = path.join(root, '.tts-convert-env');
  const bin = process.platform === 'win32' ? path.join(venv, 'Scripts') : path.join(venv, 'bin');
  const py = path.join(bin, 'python');
  if (!fs.existsSync(py)) run(python, ['-m', 'venv', venv]);
  return { venv, python: py };
}

function ensureDependencies(py) {
  run(py, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel']);
  run(py, ['-m', 'pip', 'install', 'TTS==0.22.0', 'onnx', 'onnxruntime']);
}

const female = path.join(candidates, 'kamtera-female', 'best_model_30824.pth');
const femaleConfig = path.join(candidates, 'kamtera-female', 'config.json');
const male = path.join(candidates, 'kamtera-male', 'best_model_91323.pth');
const maleConfig = path.join(candidates, 'kamtera-male', 'config.json');
for (const file of [female, femaleConfig, male, maleConfig]) if (!fs.existsSync(file)) fail(`missing candidate file: ${file}`);

const python = pickPython();
const env = ensureVenv(python);
ensureDependencies(env.python);

run(env.python, [path.join(__dirname, 'convert-kamtera-vits-to-sherpa.py')]);

const prepared = [
  ['kamtera-female', path.join(outputs, 'kamtera-female')],
  ['kamtera-male', path.join(outputs, 'kamtera-male')],
];

for (const [name, dir] of prepared) {
  const model = path.join(dir, 'model.onnx');
  const tokens = path.join(dir, 'tokens.txt');
  if (!fs.existsSync(model) || !fs.existsSync(tokens)) fail(`${name}: conversion output incomplete`);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(androidAssets, `vits-coqui-fa-iran-${name.replace('kamtera-', '')}`);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(dir, target, { recursive: true });
  if (fs.statSync(path.join(target, 'model.onnx')).size < 10_000_000) fail(`${name}: Android model is unexpectedly small`);
}

console.log('KAMTERA ANDROID PREP PASS');
