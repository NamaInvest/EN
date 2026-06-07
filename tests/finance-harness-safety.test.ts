import { describe, it, expect } from 'vitest';
import { 
  assertDebitCreditBalanced, 
  assertDebitCreditUnbalanced, 
  assertNoMutationInPreview, 
  assertTenantMatches, 
  assertClosedPeriodRejected, 
  assertPostedDocumentImmutable, 
  assertFinancialTransactionRollbackReady, 
  assertAuditExpectationDefined 
} from './harness/finance-assertions';
import { 
  buildChartOfAccountsSeedPlan, 
  buildBalancedJournalSeedPlan, 
  buildUnbalancedJournalSeedPlan, 
  buildLockedPeriodSeedPlan, 
  buildOpenItemSeedPlan, 
  buildFxRateSeedPlan, 
  buildPreviewOnlySeedPlan 
} from './harness/finance-seed-plan';

describe('Finance Test Harness Safety Guard Verification', () => {

  // 1. Balanced/Unbalanced Journal Entry Lines
  it('should pass if debit and credit are perfectly balanced', () => {
    const lines = [
      { debit: 1500, credit: 0 },
      { debit: 0, credit: 1500 }
    ];
    expect(() => assertDebitCreditBalanced(lines)).not.toThrow();
  });

  it('should throw error if debit and credit totals do not match', () => {
    const lines = [
      { debit: 1500, credit: 0 },
      { debit: 0, credit: 1490 } // 10 diff
    ];
    expect(() => assertDebitCreditBalanced(lines)).toThrow('CRITICAL: Journal Entry is unbalanced');
  });

  it('should pass unbalanced assertion when entry is unbalanced', () => {
    const lines = [
      { debit: 1500, credit: 0 },
      { debit: 0, credit: 1450 }
    ];
    expect(() => assertDebitCreditUnbalanced(lines)).not.toThrow();
  });

  // 2. Preview No Mutation Assertions
  it('should pass if before and after snapshots are identical', () => {
    const before = { tenantId: 'tenant_123', ledgerBalance: 25000 };
    const after = { tenantId: 'tenant_123', ledgerBalance: 25000 };
    expect(() => assertNoMutationInPreview(before, after)).not.toThrow();
  });

  it('should throw if preview modifies any state data', () => {
    const before = { tenantId: 'tenant_123', ledgerBalance: 25000 };
    const after = { tenantId: 'tenant_123', ledgerBalance: 30000 }; // mutated
    expect(() => assertNoMutationInPreview(before, after)).toThrow('CRITICAL: Preview operation caused state mutations');
  });

  // 3. Tenant Scoping Financial Data
  it('should pass if record tenant matches expected tenant', () => {
    const record = { tenantId: 'tenant_mock_abc', code: '110101' };
    expect(() => assertTenantMatches(record, 'tenant_mock_abc')).not.toThrow();
  });

  it('should throw if tenant mismatch is detected', () => {
    const record = { tenantId: 'tenant_mock_abc', code: '110101' };
    expect(() => assertTenantMatches(record, 'tenant_mock_xyz')).toThrow('CRITICAL: Tenant isolation breach');
  });

  // 4. Closed Period Rejection
  it('should pass assertion when error matches locked period indicators', () => {
    const errorLocked = { code: 'LOCKED', message: 'The period is closed' };
    const errorArabic = { code: 'OTHER', message: 'الفترة المحاسبية مغلقة ولا يمكن تعديلها' };
    
    expect(() => assertClosedPeriodRejected(errorLocked)).not.toThrow();
    expect(() => assertClosedPeriodRejected(errorArabic)).not.toThrow();
  });

  it('should throw error if exception does not indicate locked period', () => {
    const badError = { code: 'INTERNAL_ERROR', message: 'Something else failed' };
    expect(() => assertClosedPeriodRejected(badError)).toThrow('CRITICAL: Closed period posting was expected to throw');
  });

  // 5. Posted Record Immutability
  it('should pass when error indicates immutability validation rule', () => {
    const err1 = { message: 'لا يمكن تعديل JournalEntry بحالة "posted"' };
    const err2 = { message: 'Document is posted and immutable' };
    
    expect(() => assertPostedDocumentImmutable(err1)).not.toThrow();
    expect(() => assertPostedDocumentImmutable(err2)).not.toThrow();
  });

  it('should throw if update failure is not due to immutability', () => {
    const badError = { message: 'Database connection timeout' };
    expect(() => assertPostedDocumentImmutable(badError)).toThrow('CRITICAL: Update to posted document was expected to be blocked');
  });

  // 6. Transaction Rollback Readiness
  it('should pass rollback check if enabled', () => {
    expect(() => assertFinancialTransactionRollbackReady({ rollbackEnabled: true })).not.toThrow();
    expect(() => assertFinancialTransactionRollbackReady({ rollbackEnabled: false, disposableDB: true })).not.toThrow();
  });

  it('should throw if rollback is disabled and no disposable DB is configured', () => {
    expect(() => assertFinancialTransactionRollbackReady({ rollbackEnabled: false, disposableDB: false })).toThrow(
      'CRITICAL: Financial integration test is not configured for transaction rollback'
    );
  });

  // 7. Audit expectations
  it('should pass audit verification if required fields exist', () => {
    const auditObj = {
      action: 'JOURNAL_POST',
      userId: 123,
      tenantId: 'tenant_abc',
      timestamp: '2026-06-07T05:00:00Z'
    };
    expect(() => assertAuditExpectationDefined(auditObj)).not.toThrow();
  });

  it('should throw if any audit field is missing', () => {
    const badAudit = {
      action: 'JOURNAL_POST',
      userId: 0,
      tenantId: '',
      timestamp: '2026-06-07'
    };
    expect(() => assertAuditExpectationDefined(badAudit as any)).toThrow('CRITICAL: Financial audit log expectation plan');
  });

  // 8. Seed Plans Generation
  it('should generate seed plans successfully without writes', () => {
    const tenant = 'tenant_mock_finance';
    
    expect(buildChartOfAccountsSeedPlan(tenant).type).toBe('COA_SEED');
    expect(buildBalancedJournalSeedPlan(tenant).payload.lines.length).toBe(2);
    expect(buildUnbalancedJournalSeedPlan(tenant).payload.lines[1].credit).toBe(490);
    expect(buildLockedPeriodSeedPlan(tenant).payload.status).toBe('LOCKED');
    expect(buildOpenItemSeedPlan(tenant).payload.amountDue).toBe(15000);
    expect(buildFxRateSeedPlan(tenant).payload.rate).toBe(3.75);
    expect(buildPreviewOnlySeedPlan(tenant).payload.previewMode).toBe(true);
  });

});
