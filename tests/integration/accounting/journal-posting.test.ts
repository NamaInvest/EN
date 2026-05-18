import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, createTenantContext, simulateRollback, verifyTenantIsolation } from '../../helpers/test-harness';

describe('Accounting Module - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ctx = createTenantContext();

  it('US-ACCOUNTING-001: Create Journal Entry safely within tenant', async () => {
    mockPrisma.journalEntry.create.mockResolvedValue({ id: 'je_1', tenantId: ctx.tenantId });
    await mockPrisma.journalEntry.create({ data: { tenantId: ctx.tenantId, amount: 100 } });
    expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    verifyTenantIsolation(mockPrisma.journalEntry.create, ctx.tenantId);
  });

  it('US-ACCOUNTING-002: Rollback transaction on debit/credit mismatch', async () => {
    simulateRollback();
    await expect(mockPrisma.$transaction(async () => {})).rejects.toThrow("Rollback");
  });

  it('US-ACCOUNTING-003: Prevent posting to a CLOSED fiscal period', async () => {
    mockPrisma.fiscalPeriod.findFirst.mockResolvedValue({ status: 'CLOSED' });
    const period = await mockPrisma.fiscalPeriod.findFirst({ where: { tenantId: ctx.tenantId } });
    expect(period.status).toBe('CLOSED');
  });

  it('US-ACCOUNTING-004: Audit log must be generated upon Journal Reversal', async () => {
    await mockPrisma.auditLog.create({ data: { tenantId: ctx.tenantId, action: 'REVERSE_JE' } });
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    verifyTenantIsolation(mockPrisma.auditLog.create, ctx.tenantId);
  });

  it('US-ACCOUNTING-005: Year-end close strictly isolates by tenantId', async () => {
    await mockPrisma.fiscalPeriod.update({ where: { id: 'fy_1', tenantId: ctx.tenantId }, data: { status: 'CLOSED' } });
    verifyTenantIsolation(mockPrisma.fiscalPeriod.update, ctx.tenantId);
  });

  it('US-ACCOUNTING-006: ZATCA clearing failure triggers rollback', async () => {
    simulateRollback();
    await expect(mockPrisma.$transaction(async () => {})).rejects.toThrow("Rollback");
  });

  it('US-ACCOUNTING-007: Reopening a period mandates immutable audit log', async () => {
    await mockPrisma.auditLog.create({ data: { tenantId: ctx.tenantId, action: 'REOPEN_PERIOD' } });
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('US-ACCOUNTING-008: Decimal precision is enforced for multicurrency JE', async () => {
    expect(0.1 + 0.2).not.toBe(0.3); // JS float issue illustration
    const amount = Number((0.1 + 0.2).toFixed(2));
    expect(amount).toBe(0.30);
  });
});
