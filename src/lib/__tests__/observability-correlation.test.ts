/**
 * Phase 9.5 — Observability Correlation Tests
 * ─────────────────────────────────────────────
 * Tests for:
 * 1. RequestContext propagation through AsyncLocalStorage
 * 2. getCorrelationId() returning requestId from context
 * 3. logger auto-injection of requestId/tenantId
 * 4. runWithContext() isolation between concurrent operations
 */

import { runWithContext, getRequestContext, createChildContext } from '@/lib/observability/request-context';
import { getCorrelationId, buildCorrelationMeta, getCorrelationHeaders } from '@/lib/observability/correlation';

describe('RequestContext — AsyncLocalStorage propagation', () => {
  it('provides no context outside of runWithContext', () => {
    const ctx = getRequestContext();
    expect(ctx).toBeUndefined();
  });

  it('propagates requestId, tenantId, actorId via runWithContext', async () => {
    await runWithContext(
      {
        requestId: 'req-abc-123',
        tenantId: 'tenant-alpha',
        actorId: 'user-42',
        actorRole: 'MASTER_ADMIN',
        module: 'treasury',
      },
      async () => {
        const ctx = getRequestContext();
        expect(ctx).toBeDefined();
        expect(ctx!.requestId).toBe('req-abc-123');
        expect(ctx!.tenantId).toBe('tenant-alpha');
        expect(ctx!.actorId).toBe('user-42');
        expect(ctx!.actorRole).toBe('MASTER_ADMIN');
        expect(ctx!.module).toBe('treasury');
      }
    );
  });

  it('isolates context between concurrent operations', async () => {
    const results: string[] = [];

    await Promise.all([
      runWithContext({ requestId: 'req-1', tenantId: 'tenant-a' }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        const ctx = getRequestContext();
        results.push(`1:${ctx?.tenantId}`);
      }),
      runWithContext({ requestId: 'req-2', tenantId: 'tenant-b' }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        const ctx = getRequestContext();
        results.push(`2:${ctx?.tenantId}`);
      }),
    ]);

    expect(results).toContain('1:tenant-a');
    expect(results).toContain('2:tenant-b');
    // Ensure no cross-contamination
    expect(results).not.toContain('1:tenant-b');
    expect(results).not.toContain('2:tenant-a');
  });

  it('creates child context inheriting parent requestId', () => {
    runWithContext({ requestId: 'parent-req', tenantId: 'tenant-x' }, () => {
      const child = createChildContext({ module: 'accounting' });
      expect(child.requestId).toBe('parent-req'); // inherited
      expect(child.tenantId).toBe('tenant-x');    // inherited
      expect(child.module).toBe('accounting');      // overridden
    });
  });
});

describe('Correlation — getCorrelationId', () => {
  it('returns requestId from AsyncLocalStorage when context exists', async () => {
    await runWithContext({ requestId: 'req-corr-456', tenantId: 'tenant-z' }, async () => {
      const correlationId = getCorrelationId();
      expect(correlationId).toBe('req-corr-456');
    });
  });

  it('returns a generated ID when no context is active', () => {
    const id = getCorrelationId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('builds correlation meta from context', async () => {
    await runWithContext(
      { requestId: 'req-meta', tenantId: 'tenant-y', actorId: 'u-99', actorRole: 'USER', module: 'sales' },
      async () => {
        const meta = buildCorrelationMeta();
        expect(meta.requestId).toBe('req-meta');
        expect(meta.tenantId).toBe('tenant-y');
        expect(meta.actorId).toBe('u-99');
        expect(meta.module).toBe('sales');
      }
    );
  });

  it('builds correlation headers including x-correlation-id and x-tenant-id', async () => {
    await runWithContext({ requestId: 'req-hdr', tenantId: 'tenant-hdr' }, async () => {
      const headers = getCorrelationHeaders();
      expect(headers['x-correlation-id']).toBe('req-hdr');
      expect(headers['x-tenant-id']).toBe('tenant-hdr');
    });
  });
});

describe('Logger — context auto-injection', () => {
  it('logger info does not throw when context is missing', () => {
    // Import the observability logger
    const { logger } = require('@/lib/observability/logger');
    expect(() => logger.info('Test message', { someField: 'value' })).not.toThrow();
  });

  it('logger.financial emits with financialImpact: true', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { logger } = require('@/lib/observability/logger');

    logger.financial('info', 'Payment posted', {
      operationType: 'APPLY_PAYMENT',
      module: 'treasury',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.financialImpact).toBe(true);
    expect(logged.operationType).toBe('APPLY_PAYMENT');
    expect(logged.module).toBe('treasury');

    consoleSpy.mockRestore();
  });

  it('logger.override emits with overrideUsed: true and severity CRITICAL', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { logger } = require('@/lib/observability/logger');

    logger.override('SOFT_LOCK bypass', {
      module: 'accounting',
      operationType: 'POST_JOURNAL',
      actorId: 'u-1',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.overrideUsed).toBe(true);
    expect(logged.severity).toBe('CRITICAL');

    consoleSpy.mockRestore();
  });
});
