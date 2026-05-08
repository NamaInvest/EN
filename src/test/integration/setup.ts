import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export class IntegrationTestContext {
  postgres!: StartedPostgreSqlContainer;
  redis!: StartedRedisContainer;
  prisma!: PrismaClient;
  redisClient!: Redis;

  async setup() {
    this.postgres = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('namasoft_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    this.redis = await new RedisContainer('redis:7-alpine').start();

    process.env.DATABASE_URL = this.postgres.getConnectionUri();
    process.env.REDIS_URL = this.redis.getConnectionUrl();

    this.prisma = new PrismaClient({
      datasources: { db: { url: this.postgres.getConnectionUri() } },
    });

    this.redisClient = new Redis(this.redis.getConnectionUrl());
  }

  async teardown() {
    await this.prisma.$disconnect();
    await this.redisClient.quit();
    await this.postgres.stop();
    await this.redis.stop();
  }
}
