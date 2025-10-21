import { rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const backendRoot = path.dirname(fileURLToPath(import.meta.url));
  const prismaSchema = path.resolve(backendRoot, 'src/dal/sql/prisma/schema.prisma');
  const command = `prisma db push --accept-data-loss --schema="${prismaSchema}"`;

  execSync(command, {
    stdio: 'ignore',
    cwd: backendRoot,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./test.db',
    },
  });
} catch (error) {
  console.error('Failed to push Prisma schema for tests');
  console.error(error);
  throw error;
}
