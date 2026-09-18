import { spawn } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const isWindows = process.platform === 'win32';
const errorPattern = /\b(error|err|fatal|failed|failure|exception|panic|invalid|denied|cannot|unable|not found|missing|enoent|eperm|eaddrinuse)\b|[✗✖]/i;
const localDatabaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/my_personal_assistant';

const steps = [
  ['pnpm install', 'pnpm install --frozen-lockfile'],
  ['local postgres', 'docker compose -f docker-compose.local.yml up -d postgres'],
  ['prisma generate', 'pnpm --dir apps/backend prisma generate'],
  ['prisma migrate deploy', 'pnpm --dir apps/backend prisma migrate deploy'],
  ['backend typecheck', 'pnpm --dir apps/backend typecheck'],
  ['backend unit tests', 'pnpm --dir apps/backend test -- --runInBand'],
  ['backend build', 'pnpm --dir apps/backend build'],
  ['global daily prices', 'pnpm --dir apps/backend price-intelligence:global-daily'],
  ['mobile typecheck', 'pnpm --dir apps/mobile typecheck'],
  ['mobile tests', 'pnpm --dir apps/mobile test'],
  ['android prebuild', 'pnpm --dir apps/mobile exec expo prebuild --platform android'],
  ['android release apk', isWindows ? 'apps/mobile/android/gradlew.bat assembleRelease --no-daemon' : './apps/mobile/android/gradlew assembleRelease --no-daemon'],
];

function run(name, command) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      DATABASE_URL: localDatabaseUrl,
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    };
    const child = spawn(command, { cwd: root, env, shell: true, windowsHide: true });
    let stdoutTail = '';
    let stderrTail = '';
    const keep = (chunk, sink) => {
      const text = sink + chunk.toString();
      const lines = text.split(/\r?\n/);
      return lines.pop() ?? '';
    };
    const matches = [];
    let outBuffer = '';
    let errBuffer = '';
    const scan = (text, source) => {
      const lines = text.split(/\r?\n/);
      const tail = lines.pop() ?? '';
      for (const line of lines) {
        if (errorPattern.test(line) && matches.length < 80) matches.push(source === 'stderr' ? line : line);
      }
      return tail;
    };
    child.stdout.on('data', (chunk) => {
      outBuffer = scan(outBuffer + chunk.toString(), 'stdout');
    });
    child.stderr.on('data', (chunk) => {
      errBuffer = scan(errBuffer + chunk.toString(), 'stderr');
    });
    child.on('error', (error) => {
      matches.push(error.message);
    });
    child.on('close', (code, signal) => {
      const failed = code !== 0 || signal !== null;
      if (failed) {
        console.error(`ERROR [${name}] exit=${code ?? 'null'} signal=${signal ?? 'none'}`);
        if (matches.length) {
          for (const line of matches) console.error(line);
        } else {
          console.error(`ERROR [${name}] command failed: ${command}`);
        }
      }
      resolve(!failed);
    });
  });
}

const failures = [];
for (const [name, command] of steps) {
  const ok = await run(name, command);
  if (!ok) failures.push(name);
}

if (failures.length) {
  process.exitCode = 1;
}
