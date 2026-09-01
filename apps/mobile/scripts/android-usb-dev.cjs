const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false, ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('node', ['scripts/prepare-persian-tts-model.cjs']);
run('node', ['scripts/prepare-khadijah-tts-model.cjs']);
run('npx', ['expo', 'prebuild', '--platform', 'android']);
run('adb', ['reverse', 'tcp:3000', 'tcp:3000']);
run('adb', ['reverse', 'tcp:8081', 'tcp:8081']);

const env = {
  ...process.env,
  EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3000',
};

run('npx', ['expo', 'run:android'], { env });
