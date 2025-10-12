import { PrismaClient } from "../../generated/prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

let testPrisma: PrismaClient | null = null;

export async function setupTestDatabase(): Promise<PrismaClient> {
  // Use SQLite for ephemeral testing
  const testDbPath = path.join(__dirname, "../../test.db");
  const TEST_DATABASE_URL = `file:${testDbPath}`;

  // Set environment variable
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  // Create new Prisma client
  testPrisma = new PrismaClient({
    datasources: {
      db: { url: TEST_DATABASE_URL },
    },
  });

  // Push schema to test database
  console.log("📦 Setting up test database...");
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe", // Suppress output
  });

  console.log("✅ Test database ready");
  return testPrisma;
}

export async function cleanupTestDatabase(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }

  // Delete test database file
  const testDbPath = path.join(__dirname, "../../test.db");
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  if (fs.existsSync(`${testDbPath}-journal`)) {
    fs.unlinkSync(`${testDbPath}-journal`);
  }
}

export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  // Clear all tables in correct order (respecting foreign keys)
  const tablenames = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations';
  `;

  // Disable foreign keys temporarily
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");

  for (const { name } of tablenames) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${name};`);
  }

  // Re-enable foreign keys
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");

  console.log("🧹 Test database reset");
}

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    throw new Error(
      "Test database not initialized. Call setupTestDatabase() first."
    );
  }
  return testPrisma;
}
