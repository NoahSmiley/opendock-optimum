import { rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

process.env.NODE_ENV = 'test';
process.env.OPENDOCK_DAL = process.env.OPENDOCK_DAL ?? 'sql';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./test.db';
process.env.OPENDOCK_WEB_ORIGIN = process.env.OPENDOCK_WEB_ORIGIN ?? 'http://localhost:5173';

if (process.env.CLEAR_TEST_DB !== 'false') {
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.slice('file:'.length);
    if (dbPath && existsSync(dbPath)) {
      rmSync(dbPath, { force: true });
    }
  }
}

try {
  execSync('npx prisma db push --accept-data-loss --schema=src/dal/sql/prisma/schema.prisma', {
    stdio: 'ignore',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./test.db',
    },
  });
} catch (error) {
  console.error('Failed to push Prisma schema for tests', error);
  throw error;
}
