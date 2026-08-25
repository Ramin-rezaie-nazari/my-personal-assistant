const { spawnSync } = require('node:child_process');

const commands = [
  ['Mobile typecheck', ['--filter', '@my-personal-assistant/mobile', 'typecheck']],
  ['Mobile voice quality', ['--filter', '@my-personal-assistant/mobile', 'voice:quality']],
  ['Mobile UI quality', ['--filter', '@my-personal-assistant/mobile', 'ui:quality']],
  ['D1 repository readiness', ['--filter', '@my-personal-assistant/mobile', 'd1:readiness']],
  ['Backend typecheck', ['--filter', 'backend', 'typecheck']],
  ['Backend unit tests', ['--filter', 'backend', 'test', '--', '--runInBand']],
  ['Backend lint', ['--filter', 'backend', 'lint']],
  ['Backend build', ['--filter', 'backend', 'build']],
];

for (const [label, args] of commands) {
  console.log(`\n===== ${label} =====`);
  const result = spawnSync('pnpm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`\nD1 FINAL VERIFICATION FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nD1 FINAL REPOSITORY VERIFICATION PASS: all deterministic mobile + backend gates completed successfully.');
