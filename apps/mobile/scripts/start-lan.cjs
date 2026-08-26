const { spawn } = require('node:child_process');
const os = require('node:os');

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  const preferred = ['en0', 'en1'];
  const candidates = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      if (entry.address.startsWith('169.254.')) continue;
      candidates.push({ name, address: entry.address });
    }
  }

  candidates.sort((a, b) => {
    const aPreferred = preferred.indexOf(a.name);
    const bPreferred = preferred.indexOf(b.name);
    const aRank = aPreferred === -1 ? 100 : aPreferred;
    const bRank = bPreferred === -1 ? 100 : bPreferred;
    return aRank - bRank;
  });

  if (!candidates[0]) {
    throw new Error('Could not determine a non-loopback LAN IPv4 address.');
  }

  return candidates[0];
}

const { name: interfaceName, address } = getLanAddress();
const apiUrl = `http://${address}:3000`;

console.log(`MYPA LAN development mode`);
console.log(`Network interface: ${interfaceName}`);
console.log(`Device API URL: ${apiUrl}`);
console.log(`Ensure the phone and Mac are on the same Wi-Fi network.`);
console.log(`Backend must be running on port 3000.`);
console.log('');

const expo = spawn('npx', ['expo', 'start', '--dev-client', '--lan', ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? apiUrl,
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
