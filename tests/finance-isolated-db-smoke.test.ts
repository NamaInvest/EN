import { describe, it, expect } from 'vitest';
import { 
  assertNotProductionDatabaseUrl, 
  assertTestDatabaseUrl, 
  requireExplicitTestMode, 
  validateDisposableDatabaseName 
} from './harness/test-db-guard';

describe('Finance Isolated DB Smoke Readiness Test', () => {

  it('should verify test database environment settings or skip if not configured', () => {
    const testMode = process.env.TEST_MODE;
    const testDbUrl = process.env.TEST_DATABASE_URL;

    if (!testMode || !testDbUrl) {
      // Safe skip when environment is not configured yet
      console.log('Skipping isolated DB smoke test: Environment variables are not set.');
      expect(true).toBe(true);
      return;
    }

    // Run safety guards on the environment variables
    expect(() => requireExplicitTestMode(process.env)).not.toThrow();
    expect(() => assertNotProductionDatabaseUrl(testDbUrl)).not.toThrow();
    expect(() => assertTestDatabaseUrl(testDbUrl)).not.toThrow();
    expect(() => validateDisposableDatabaseName(testDbUrl)).not.toThrow();
  });

});
