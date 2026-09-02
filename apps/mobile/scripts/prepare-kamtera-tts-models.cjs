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

function pythonVersion(command) {
  const probe = spawnSync(command, ['--version'], { encoding: 'utf8' });
  if (probe.status !== 0) return null;
  const match = `${probe.stdout || ''}${probe.stderr || ''}`.match(/Python (\d+)\.(\d+)/);
  return match ? `${match[1]}.${match[2]}` : null;
}

function pickPython() {
  for (const candidate of ['python3.11', 'python3.10', 'python3']) {
    const version = pythonVersion(candidate);
    if (!version) continue;
    const [major, minor] = version.split('.').map(Number);
    if (major === 3 && minor >= 10 && minor <= 11) return { command: candidate, version };
  }
  if (spawnSync('uv', ['--version'], { stdio: 'ignore' }).status === 0) return { command: 'uv', version: 'uv' };
  fail('Python 3.10/3.11 or uv is required for Coqui VITS export. Python 3.14 is intentionally not used.');
}

function ensureVenv(runtime) {
  const venv = path.join(root, '.tts-convert-env');
  const bin = process.platform === 'win32' ? path.join(venv, 'Scripts') : path.join(venv, 'bin');
  const py = path.join(bin, 'python');
  if (fs.existsSync(py)) return { venv, python: py };
  if (runtime.command === 'uv') run('uv', ['venv', '--python', '3.11', venv]);
  else run(runtime.command, ['-m', 'venv', venv]);
  return { venv, python: py };
}

function ensureDependencies(py) {
  const probe = spawnSync(py, ['-c', "import TTS, onnx, onnxruntime"], { stdio: 'ignore' });
  if (probe.status === 0) return;
  run(py, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel']);
  run(py, ['-m', 'pip', 'install', 'TTS==0.22.0', 'onnx', 'onnxruntime']);
}

const requiredCandidates = [
  path.join(candidates, 'kamtera-female', 'best_model_30824.pth'),
  path.join(candidates, 'kamtera-female', 'config.json'),
  path.join(candidates, 'kamtera-male', 'best_model_91323.pth'),
  path.join(candidates, 'kamtera-male', 'config.json'),
];
for (const file of requiredCandidates) if (!fs.existsSync(file)) fail(`missing candidate file: ${file}`);

const runtime = pickPython();
const env = ensureVenv(runtime);
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
  const target = path.join(androidAssets, `vits-coqui-fa-iran-${name.replace('kamtera-', '')}`);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(dir, target, { recursive: true });
  if (fs.statSync(path.join(target, 'model.onnx')).size < 10_000_000) fail(`${name}: Android model is unexpectedly small`);
}

console.log('KAMTERA ANDROID PREP PASS');
