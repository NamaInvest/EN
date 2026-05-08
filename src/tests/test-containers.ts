/**
 * Test Containers Integration Setup
 * ──────────────────────────────────────────────────────────
 * Automatically spins up PostgreSQL and Redis instances for integration testing.
 */

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';
import { Client } from 'pg';
import { createClient } from 'redis';

let pgContainer: any;
let redisContainer: any;
let pgClient: Client;
let redisClient: any;

export const testContainers = {
  async setup() {
    console.log('📦 Starting Test Containers...');
    
    // Start PostgreSQL
    pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('namasoft_test')
      .withUsername('test_user')
      .withPassword('test_pass')
      .start();

    const dbUri = pgContainer.getConnectionUri();
    process.env.DATABASE_URL = dbUri;

    // Start Redis
    redisContainer = await new RedisContainer('redis:7-alpine').start();
    const redisUri = redisContainer.getConnectionUrl();
    process.env.REDIS_URL = redisUri;

    console.log('✅ Containers running. Applying Prisma migrations...');
    
    // Run migrations
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to apply migrations to test DB', e);
      throw e;
    }

    // Connect clients
    pgClient = new Client({ connectionString: dbUri });
    await pgClient.connect();
    
    redisClient = createClient({ url: redisUri });
    await redisClient.connect();

    return { dbUri, redisUri };
  },

  async teardown() {
    console.log('🛑 Stopping Test Containers...');
    if (pgClient) await pgClient.end();
    if (redisClient) await redisClient.disconnect();
    if (pgContainer) await pgContainer.stop();
    if (redisContainer) await redisContainer.stop();
    console.log('✅ Containers stopped.');
  },

  async clearDatabase() {
    if (!pgClient) return;
    const tables = await pgClient.query(`
      SELECT tablename FROM pg_tables WHERE schemaname='public';
    `);
    
    for (const { tablename } of tables.rows) {
      if (tablename !== '_prisma_migrations') {
        await pgClient.query(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      }
    }
    
    if (redisClient) {
      await redisClient.flushAll();
    }
  }
};
