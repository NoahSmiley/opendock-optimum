import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __opendock_prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__opendock_prisma__ ??
  new PrismaClient({
    log: process.env.PRISMA_LOG_LEVEL ? ["query", "info", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__opendock_prisma__ = prisma;
}

