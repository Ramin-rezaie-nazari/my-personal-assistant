const { spawn } = require('node:child_process');

const apiUrl = 'http://127.0.0.1:3000';

console.log('MYPA USB development mode');
console.log('Device API URL: http://127.0.0.1:3000 (ADB reverse -> Mac:3000)');
console.log('Metro URL: http://localhost:8081 (ADB reverse -> Mac:8081)');
console.log('Backend must be running on port 3000.');
console.log('');

const expo = spawn('npx', ['expo', 'start', '--dev-client', '--localhost', ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_API_URL: apiUrl,
  },
  stdio: 'inherit',
  shell: false,
});

expo.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

expo.on('error', (error) => {
  console.error(`Failed to start Expo: ${error.message}`);
  process.exit(1);
});
