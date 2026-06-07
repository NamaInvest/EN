/**
 * Pure assertions library for ERP financial checks.
 * Contains no dependencies on a live database or Prisma.
 */

export interface JournalLineLike {
  debit: number;
  credit: number;
}

export function assertDebitCreditBalanced(lines: JournalLineLike[]): void {
  let totalDebit = 0;
  let totalCredit = 0;
  
  for (const line of lines) {
    totalDebit += line.debit;
    totalCredit += line.credit;
  }
  
  // Use decimal rounding comparison to avoid float inaccuracies
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.005) {
    throw new Error(`CRITICAL: Journal Entry is unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${diff}`);
  }
}

export function assertDebitCreditUnbalanced(lines: JournalLineLike[]): void {
  try {
    assertDebitCreditBalanced(lines);
  } catch (error) {
    // Unbalanced is expected, so we pass
    return;
  }
  throw new Error('CRITICAL: Journal Entry was expected to be unbalanced but passed balance validation.');
}

export function assertNoMutationInPreview(before: any, after: any): void {
  const beforeJson = JSON.stringify(before);
  const afterJson = JSON.stringify(after);
  
  if (beforeJson !== afterJson) {
    throw new Error('CRITICAL: Preview operation caused state mutations on database snapshot.');
  }
}

export function assertTenantMatches(record: { tenantId: string }, tenantId: string): void {
  if (record.tenantId !== tenantId) {
    throw new Error(`CRITICAL: Tenant isolation breach. Record tenant: "${record.tenantId}", Expected tenant: "${tenantId}".`);
  }
}

export function assertClosedPeriodRejected(error: any): void {
  const code = error?.code || '';
  const message = error?.message || '';
  
  const isLocked = code === 'LOCKED' || message.includes('الفترة المحاسبية مغلقة');
  
  if (!isLocked) {
    throw new Error('CRITICAL: Closed period posting was expected to throw locked period exception, but got different error shape.');
  }
}

export function assertPostedDocumentImmutable(error: any): void {
  const message = error?.message || '';
  
  const isImmutable = message.includes('لا يمكن تعديل') || message.includes('posted');
  
  if (!isImmutable) {
    throw new Error('CRITICAL: Update to posted document was expected to be blocked with immutability exception, but got different error.');
  }
}

export interface RollbackPlanLike {
  rollbackEnabled: boolean;
  disposableDB?: boolean;
}

export function assertFinancialTransactionRollbackReady(plan: RollbackPlanLike): void {
  if (!plan.rollbackEnabled && !plan.disposableDB) {
    throw new Error('CRITICAL: Financial integration test is not configured for transaction rollback or disposable database.');
  }
}

export interface AuditExpectationLike {
  action: string;
  userId: number;
  tenantId: string;
  timestamp: string;
}

export function assertAuditExpectationDefined(expectation: AuditExpectationLike): void {
  if (!expectation.action || !expectation.userId || !expectation.tenantId || !expectation.timestamp) {
    throw new Error('CRITICAL: Financial audit log expectation plan is missing required fields.');
  }
}
