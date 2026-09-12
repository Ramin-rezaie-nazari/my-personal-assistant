const path = require('node:path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env.test');
dotenv.config({ path: envPath, override: true });

if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL is missing after loading ${envPath}`);
  process.exit(1);
}

// The CI workflow is responsible for applying the committed Prisma migration
// history before E2E starts. This preparation step must not call `prisma db push`,
// because schema-push can hide migration drift and mutate the migration-tested DB.
console.log(`E2E database prepared by committed Prisma migrations: ${process.env.DATABASE_URL.replace(/:\/\/[^@]+@/, '://***@')}`);
process.exit(0);
