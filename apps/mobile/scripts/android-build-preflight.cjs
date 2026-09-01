const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..', '..');
const mobile = path.join(root, 'apps', 'mobile');
const android = path.join(mobile, 'android');
const packageJsonPath = path.join(mobile, 'package.json');

function fail(message) {
  console.error(`ANDROID BUILD PREFLIGHT FAILED: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`cannot read ${path.relative(root, file)}: ${error.message}`);
  }
}

function resolvePackageJson(pkg) {
  try {
    return require.resolve(`${pkg}/package.json`, { paths: [mobile] });
  } catch {}

  const virtualStore = path.join(root, 'node_modules', '.pnpm');
  if (!fs.existsSync(virtualStore)) return null;

  const packageDirName = pkg.replace('/', '+').replace('@', '@');
  const candidates = fs.readdirSync(virtualStore)
    .filter((entry) => entry.startsWith(`${packageDirName}@`))
    .sort()
    .map((entry) => path.join(virtualStore, entry, 'node_modules', pkg, 'package.json'))
    .filter((file) => fs.existsSync(file));

  return candidates[0] ?? null;
}

function installedVersion(pkg) {
  const file = resolvePackageJson(pkg);
  if (!file) throw new Error(`cannot resolve ${pkg}/package.json`);
  return { version: readJson(file).version, file };
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  if (result.error) fail(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  if (result.status !== 0) {
    const output = `${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim();
    fail(`${command} ${args.join(' ')} exited ${result.status}\n${output.slice(-2500)}`);
  }
  return `${result.stdout ?? ''}`;
}

const pkg = readJson(packageJsonPath);
const expected = {
  expo: '53.0.27',
  react: '19.0.0',
  'react-native': '0.79.6',
  'expo-modules-core': '2.5.0',
  'expo-modules-autolinking': '2.1.15',
  'expo-speech-recognition': '2.1.5',
};

for (const [name, expectedVersion] of Object.entries(expected)) {
  const declared = name === 'expo-modules-core'
    ? null
    : pkg.dependencies?.[name];
  if (declared && !declared.includes(expectedVersion) && name === 'expo-speech-recognition') {
    fail(`${name} is declared as ${declared}; expected ${expectedVersion}`);
  }
  try {
    const actual = installedVersion(name).version;
    if (actual !== expectedVersion) fail(`${name} resolves to ${actual}; expected ${expectedVersion}`);
  } catch (error) {
    fail(`${name} is not installed correctly: ${error.message}`);
  }
}

const reactRoots = new Set();
for (const searchRoot of [root, mobile]) {
  const result = run('pnpm', ['list', 'react', '--depth', '0', '--parseable'], searchRoot);
  for (const line of result.split('\n')) {
    const match = line.match(/react@(\d+\.\d+\.\d+)/);
    if (match) reactRoots.add(match[1]);
  }
}
if (reactRoots.size > 1) fail(`multiple React versions detected: ${[...reactRoots].join(', ')}`);

const localProperties = path.join(android, 'local.properties');
if (!fs.existsSync(localProperties)) fail('android/local.properties is missing');
const sdkMatch = fs.readFileSync(localProperties, 'utf8').match(/^sdk\.dir=(.+)$/m);
if (!sdkMatch) fail('android/local.properties does not define sdk.dir');
if (!fs.existsSync(sdkMatch[1].trim())) fail(`Android SDK path does not exist: ${sdkMatch[1].trim()}`);

if (!fs.existsSync(path.join(android, 'gradlew'))) fail('android/gradlew is missing; run Expo prebuild first');

const config = run('pnpm', ['exec', 'expo', 'config', '--type', 'public'], mobile);
if (!config.includes('53.0.')) fail('Expo public config does not report SDK 53');

console.log('ANDROID BUILD PREFLIGHT PASS');
console.log(`React: ${[...reactRoots][0] ?? 'unknown'}`);
console.log(`Expo: ${expected.expo}`);
console.log('Expo modules: installed and version-aligned');
console.log('Android SDK: configured');
