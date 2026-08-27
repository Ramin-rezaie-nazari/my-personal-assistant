#!/usr/bin/env node
const { spawn } = require('node:child_process');
const os = require('node:os');

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry?.family !== 'IPv4' || entry.internal) continue;
      candidates.push(entry.address);
    }
  }
  return candidates.find((address) => /^192\.168\./.test(address))
    ?? candidates.find((address) => /^10\./.test(address))
    ?? candidates.find((address) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(address))
    ?? candidates[0]
    ?? null;
}

const host = getLanAddress();
if (!host) {
  console.error('Could not determine a LAN IPv4 address. Connect the Mac to Wi-Fi/Ethernet and try again.');
  process.exit(1);
}

const apiUrl = `http://${host}:3000`;
console.log(`MYPA LAN development mode`);
console.log(`LAN host: ${host}`);
console.log(`API URL: ${apiUrl}`);
console.log('Phone and Mac must be on the same network.');

const child = spawn('npx', ['expo', 'start', '--dev-client', '--lan', '--clear'], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl },
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
child.on('error', (error) => {
  console.error(`Failed to start Expo: ${error.message}`);
  process.exit(1);
});
