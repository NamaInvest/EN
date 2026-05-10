/**
 * @fileoverview Transaction Retry Utility Tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { withTransaction, atomically } from '../transaction';

// ── Mock Prisma client ────────────────────────────────────────────────────────
function makeMockPrisma(failCount: number = 0, errorCode: string = 'P2034') {
  let calls = 0;
  return {
    $transaction: jest.fn(async (fn: any) => {
      calls++;
      if (calls <= failCount) {
        const err: any = new Error('Transaction conflict');
        err.code = errorCode;
        throw err;
      }
      return fn({});
    }),
    _calls: () => calls,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('withTransaction — retry logic', () => {
  it('succeeds on first attempt without retrying', async () => {
    const prisma = makeMockPrisma(0);
    const result = await withTransaction(prisma, async () => 'success');
    expect(result).toBe('success');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('retries on P2034 and succeeds on second attempt', async () => {
    const prisma = makeMockPrisma(1, 'P2034'); // fail once, then succeed
    const result = await withTransaction(prisma, async () => 'retried', {
      operationName: 'test-op',
      initialDelayMs: 1, // fast test
    });
    expect(result).toBe('retried');
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('retries on deadlock (40P01) and succeeds', async () => {
    const prisma = makeMockPrisma(2, '40P01'); // fail twice
    const result = await withTransaction(prisma, async () => 'ok', {
      maxRetries: 3,
      initialDelayMs: 1,
    });
    expect(result).toBe('ok');
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it('throws after maxRetries exhausted', async () => {
    const prisma = makeMockPrisma(5, 'P2034'); // always fail
    await expect(
      withTransaction(prisma, async () => {}, { maxRetries: 3, initialDelayMs: 1 })
    ).rejects.toThrow('Transaction conflict');
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on non-retryable errors', async () => {
    const prisma = makeMockPrisma(1, 'P2002'); // unique constraint — not retryable
    await expect(
      withTransaction(prisma, async () => {}, { initialDelayMs: 1 })
    ).rejects.toThrow('Transaction conflict');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1); // only 1 attempt
  });

  it('passes transaction client to the callback', async () => {
    const prisma = makeMockPrisma(0);
    let receivedTx: any = null;
    await withTransaction(prisma, async (tx) => { receivedTx = tx; return tx; });
    expect(receivedTx).toBeDefined();
  });
});

describe('atomically — convenience wrapper', () => {
  it('succeeds on first attempt', async () => {
    const prisma = makeMockPrisma(0);
    const result = await atomically(prisma, async () => 42, 'test');
    expect(result).toBe(42);
  });

  it('inherits retry behavior from withTransaction', async () => {
    const prisma = makeMockPrisma(1, 'P2034');
    const result = await atomically(prisma, async () => 'atomic', 'test-op');
    expect(result).toBe('atomic');
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });
});
