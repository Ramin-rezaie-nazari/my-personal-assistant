import * as dotenv from 'dotenv';

dotenv.config({
  path: 'test/.env.test',
});

// Keep CI/local E2E runs reproducible even when test/.env.test only provides
// DATABASE_URL (or does not exist in a clean checkout). Secrets here are
// deterministic test-only values and can still be overridden by the caller.
process.env.NODE_ENV ??= 'test';
process.env.APP_NAME ??= 'My Personal Assistant API';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ??= '30d';
