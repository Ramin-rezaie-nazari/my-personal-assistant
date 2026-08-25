const { spawnSync } = require('node:child_process');

const commands = [
  ['Mobile typecheck', ['--filter', '@my-personal-assistant/mobile', 'typecheck']],
  ['Mobile voice quality', ['--filter', '@my-personal-assistant/mobile', 'voice:quality']],
  ['Mobile UI quality', ['--filter', '@my-personal-assistant/mobile', 'ui:quality']],
  ['D1 repository readiness', ['--filter', '@my-personal-assistant/mobile', 'd1:readiness']],
  ['Backend typecheck', ['--filter', 'backend', 'typecheck']],
  ['Backend unit tests', ['--filter', 'backend', 'test', '--runInBand']],
  ['Backend lint', ['--filter', 'backend', 'lint']],
  ['Backend build', ['--filter', 'backend', 'build']],
];

function conciseFailureOutput(stdout, stderr) {
  const output = `${stderr}\n${stdout}`.replace(/\r/g, '');
  const lines = output.split('\n');
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^PASS\s|^Test Suites:|^Tests:\s|^Snapshots:\s|^Time:\s/.test(trimmed)) return false;
    if (/VOICE QUALITY CONTRACT PASS|UI QUALITY CONTRACT PASS|D1 VOICE READINESS CONTRACT PASS/.test(trimmed)) return false;
    return /FAIL|failed|FAILED|Error|error|Expected:|Received:|Assertion|TypeError|TS\d+|Cannot find|not found|Module|at .*\.(ts|js):\d+/.test(line) || line.includes('●');
  });

  return filtered.slice(0, 120).join('\n');
}

for (const [label, args] of commands) {
  const result = spawnSync('pnpm', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    console.error(`D1 FINAL VERIFICATION FAILED: ${label}`);
    const concise = conciseFailureOutput(result.stdout ?? '', result.stderr ?? '');
    if (concise) console.error(concise);
    process.exit(result.status ?? 1);
  }
}

console.log('D1 FINAL REPOSITORY VERIFICATION PASS');
