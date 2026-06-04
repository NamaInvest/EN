import { describe, it, expect } from 'vitest';
import { maskSecrets } from '../../../src/lib/security/secret-masker';
import { scanLogContent } from '../../../src/lib/observability/safe-log-scanner';

describe('P0 Security and Observability Tools', () => {

  describe('Secret Masker', () => {
    it('should mask database connection strings with passwords', () => {
      const input = 'DATABASE_URL=postgresql://root:secure_pass_123@46.4.188.170:5432/n11_db';
      const output = maskSecrets(input);
      expect(output).toContain('postgresql://***:***@***.***.***.***:5432/n11_db');
      expect(output).not.toContain('secure_pass_123');
    });

    it('should mask passwords/tokens in query parameters', () => {
      const input = 'token=secret_123&password=my_password';
      const output = maskSecrets(input);
      expect(output).toContain('token=***');
      expect(output).toContain('password=***');
      expect(output).not.toContain('secret_123');
      expect(output).not.toContain('my_password');
    });

    it('should mask generic private key blocks', () => {
      const input = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAzs3...\n-----END RSA PRIVATE KEY-----';
      const output = maskSecrets(input);
      expect(output).toContain('-----BEGIN PRIVATE KEY-----\n***\n-----END PRIVATE KEY-----');
      expect(output).not.toContain('MIIEowIBAAKCAQEAzs3');
    });

    it('should mask IPv4 addresses', () => {
      const input = 'Access denied from IP 192.168.1.100 or 46.4.188.170';
      const output = maskSecrets(input);
      expect(output).toContain('***.***.***.***');
      expect(output).not.toContain('192.168.1.100');
      expect(output).not.toContain('46.4.188.170');
    });
  });

  describe('Safe Log Scanner', () => {
    it('should parse logs and count error types', () => {
      const logs = [
        'info: application initialized',
        'error: TypeError Cannot read property of undefined',
        'warn: Prisma connection retry',
        'error: PrismaClientInitializationError database not reached',
        'info: GET /api/health 200',
        'error: POST /api/payment 500 error processing',
        'error: unhandledRejection occurred'
      ].join('\n');

      const result = scanLogContent(logs);
      expect(result.totalLines).toBe(7);
      expect(result.errorCounts.typeError).toBe(1);
      expect(result.errorCounts.prismaError).toBe(1);
      expect(result.errorCounts.http500).toBe(1);
      expect(result.errorCounts.unhandledRejection).toBe(1);
      expect(result.errorsDetected.length).toBe(4); // all errors detected (1 typeError, 1 prismaError, 1 http500, 1 unhandledRejection)
    });

    it('should detect unmasked secrets in logs', () => {
      const logs = [
        'info: processing job',
        'error: database URL postgresql://user:password@localhost:5432/n11_db',
        'info: completed job'
      ].join('\n');

      const result = scanLogContent(logs);
      expect(result.hasSecrets).toBe(true);
      expect(result.errorsDetected[0]).toContain('postgresql://***:***@localhost:5432/n11_db');
    });
  });
});
