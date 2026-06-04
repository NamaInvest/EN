import { describe, it, expect } from 'vitest';
import { maskSecrets } from '../../src/lib/ai-ops/mcp/masking';
import { assertReadOnlyMcpOperation } from '../../src/lib/ai-ops/mcp/read-only-policy';
import { readTmpReport, writeTmpReport, deleteTmpReport } from '../../src/lib/ai-ops/mcp/report-reader';
import { readServiceLogs, triggerPM2Restart, triggerDeploy } from '../../src/lib/ai-ops/mcp/health-reader';
import { approveOnboardingRun, rejectOnboardingRun, retryOnboardingRun, createNewTenant } from '../../src/lib/ai-ops/mcp/onboarding-reader';
import { readEnvFileRaw } from '../../src/lib/ai-ops/mcp/security-reader';
import { suggestTroubleshootingSteps } from '../../src/lib/ai-ops/mcp/support-summarizer';

describe('Nama Invest AI Ops MCP Read-Only Layer', () => {

  describe('Secret Masking Utility', () => {
    it('should mask database connection strings', () => {
      const url = 'postgresql://n11_db:my_super_secret_password@localhost:5432/n11_db';
      const result = maskSecrets(url);
      expect(result).toContain('postgresql://***:***@localhost:5432/n11_db');
      expect(result).not.toContain('my_super_secret_password');
    });

    it('should mask passwords/tokens in query parameters', () => {
      const input = 'key=mykey123&password=hello&token=secret_token';
      const result = maskSecrets(input);
      expect(result).toContain('key=***');
      expect(result).toContain('password=***');
      expect(result).toContain('token=***');
      expect(result).not.toContain('mykey123');
      expect(result).not.toContain('hello');
    });

    it('should mask private key blocks', () => {
      const input = 'Some text before\n-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAzs3...\n-----END RSA PRIVATE KEY-----\nSome text after';
      const result = maskSecrets(input);
      expect(result).toContain('-----BEGIN PRIVATE KEY-----\n***\n-----END PRIVATE KEY-----');
      expect(result).not.toContain('MIIEowIBAAKCAQEAzs3');
    });

    it('should mask IPv4 addresses', () => {
      const input = 'The server is located at 192.168.1.100 and public IP 46.4.188.170';
      const result = maskSecrets(input);
      expect(result).toContain('***.***.***.***');
      expect(result).not.toContain('192.168.1.100');
      expect(result).not.toContain('46.4.188.170');
    });
  });

  describe('Read-Only Policy Guard', () => {
    it('should allow read-only tool names and arguments', () => {
      expect(() => assertReadOnlyMcpOperation('read_pm2_status', {})).not.toThrow();
      expect(() => assertReadOnlyMcpOperation('list_tmp_reports', {})).not.toThrow();
      expect(() => assertReadOnlyMcpOperation('get_onboarding_stats', { filter: 'active' })).not.toThrow();
    });

    it('should deny mutation verbs in tool names', () => {
      expect(() => assertReadOnlyMcpOperation('delete_tmp_report', {})).toThrow(/prohibited mutation verb/);
      expect(() => assertReadOnlyMcpOperation('approve_onboarding_run', {})).toThrow(/prohibited mutation verb/);
      expect(() => assertReadOnlyMcpOperation('deploy_next_build', {})).toThrow(/prohibited mutation verb/);
    });

    it('should deny mutation verbs inside tool arguments', () => {
      expect(() => assertReadOnlyMcpOperation('read_pm2_status', { action: 'delete' })).toThrow(/prohibited mutation verb/i);
      expect(() => assertReadOnlyMcpOperation('read_pm2_status', { command: 'restart' })).toThrow(/prohibited mutation verb/i);
    });
  });

  describe('Report Reader Security Policy', () => {
    it('should fail on write/delete report actions', () => {
      expect(() => writeTmpReport()).toThrow(/strictly forbidden/);
      expect(() => deleteTmpReport()).toThrow(/strictly forbidden/);
    });

    it('should deny path traversal in readTmpReport', async () => {
      await expect(readTmpReport('../.env')).rejects.toThrow(/Access Denied/);
      await expect(readTmpReport('customer-onboarding-ga-policy-runtime-revalidation-report.md')).resolves.toBeDefined();
    });
  });

  describe('Health Reader Security Policy', () => {
    it('should fail on restart or deploy actions', () => {
      expect(() => triggerPM2Restart()).toThrow(/strictly disabled/);
      expect(() => triggerDeploy()).toThrow(/strictly disabled/);
    });

    it('should deny unauthorized service names in readServiceLogs', async () => {
      await expect(readServiceLogs('unauthorized-service')).rejects.toThrow(/Access Denied/);
    });
  });

  describe('Onboarding Reader Security Policy', () => {
    it('should fail on write/onboarding mutations', () => {
      expect(() => approveOnboardingRun()).toThrow(/strictly disabled/);
      expect(() => rejectOnboardingRun()).toThrow(/strictly disabled/);
      expect(() => retryOnboardingRun()).toThrow(/strictly disabled/);
      expect(() => createNewTenant()).toThrow(/disabled/);
    });
  });

  describe('Security Reader Security Policy', () => {
    it('should fail on raw env file read', () => {
      expect(() => readEnvFileRaw()).toThrow(/strictly disabled/);
    });
  });

  describe('Support Summarizer', () => {
    it('should suggest correct steps based on error code', () => {
      const dbSteps = suggestTroubleshootingSteps('DATABASE_CREATION_FAILED', 'Connection timeout');
      expect(dbSteps).toContain('PostgreSQL');
      
      const inviteSteps = suggestTroubleshootingSteps('INVALID_INVITE_CODE', 'Wrong code');
      expect(inviteSteps).toContain('invite code');
    });
  });
});
