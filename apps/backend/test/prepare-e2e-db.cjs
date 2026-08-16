const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env.test');
dotenv.config({ path: envPath, override: true });

if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL is missing after loading ${envPath}`);
  process.exit(1);
}

const result = spawnSync('pnpm', ['prisma', 'db', 'push'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
