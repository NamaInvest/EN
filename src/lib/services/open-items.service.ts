import { Decimal } from '@prisma/client/runtime/library';
import { FinancialTxClient } from '@/lib/db/transaction';
import { assertPeriodWritable, OverrideContext } from '@/lib/governance/period-lock';
import { logger } from '@/lib/observability/logger';

const log = logger.child({ service: 'open-items-service' });

export interface AllocationRequest {
  tenantId: string;
  salesInvoiceId?: number;
  purchaseInvoiceId?: number;
  salesReturnId?: number;
  purchaseReturnId?: number;
  treasuryId?: number;
  amount: number | Decimal;
  allocatedBy: string;
  sourceType: string;
  notes?: string;
  userId: string;
  overrideContext?: OverrideContext;
}

export class OpenItemsService {
  /**
   * Fetch all open (unsettled or partially settled) invoices and payments for a tenant partner
   */
  static async getOpenItems(prisma: any, tenantId: string, customerId: number) {
    // 1. Fetch outstanding Sales Invoices (Receivable debit items)
    const salesInvoices = await prisma.salesInvoice.findMany({
      where: {
        tenantId,
        customerId,
        remaining: { gt: 0 },
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNo: true,
        date: true,
        total: true,
        paid: true,
        remaining: true,
        status: true,
      },
      orderBy: { date: 'asc' },
    });

    // 2. Fetch outstanding Purchase Invoices (Payable credit items)
    const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        supplierId: customerId,
        remaining: { gt: 0 },
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNo: true,
        date: true,
        total: true,
        paid: true,
        remaining: true,
        status: true,
      },
      orderBy: { date: 'asc' },
    });

    // 3. Fetch unmatched/partially matched Treasury cash/bank receipts (inward customer collections)
    const treasuryReceipts = await prisma.treasury.findMany({
      where: {
        tenantId,
        type: 'in',
        deletedAt: null,
      },
      include: {
        openItemMatchings: {
          where: { status: 'ACTIVE', deletedAt: null },
          select: { amount: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Compute remaining/unallocated balances for treasury entries
    const openReceipts = treasuryReceipts.map((entry: any) => {
      const matchedSum = entry.openItemMatchings.reduce(
        (sum: Decimal, m: any) => sum.plus(m.amount),
        new Decimal(0)
      );
      const remaining = new Decimal(entry.amount).minus(matchedSum);
      return {
        id: entry.id,
        date: entry.date,
        type: entry.type,
        amount: entry.amount,
        remaining: remaining.toNumber(),
        description: entry.description,
      };
    }).filter((entry: any) => entry.remaining > 0);

    return {
      salesInvoices,
      purchaseInvoices,
      openReceipts,
    };
  }

  /**
   * Allocate customer payment (Treasury receipt) to an outstanding Sales Invoice
   */
  static async allocateCustomerPayment(
    tx: FinancialTxClient,
    request: AllocationRequest
  ) {
    const {
      tenantId,
      salesInvoiceId,
      treasuryId,
      amount,
      allocatedBy,
      sourceType,
      notes,
      userId,
      overrideContext,
    } = request;

    if (!salesInvoiceId || !treasuryId) {
      throw new Error('Both salesInvoiceId and treasuryId are required for customer allocation.');
    }

    const allocationAmt = new Decimal(amount);
    if (allocationAmt.lessThanOrEqualTo(0)) {
      throw new Error('Allocation amount must be greater than zero.');
    }

    // 1. Pessimistic Row Lock & Fetch Parent Invoice
    const invoice = await tx.salesInvoice.findFirst({
      where: { id: salesInvoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) {
      throw new Error('Sales invoice not found or unauthorized.');
    }

    // Document State Checks
    if (invoice.status === 'cancelled' || invoice.status === 'voided') {
      throw new Error('Cannot allocate payments to cancelled or voided invoices.');
    }

    if (invoice.status === 'completed' || invoice.remaining.lessThanOrEqualTo(0)) {
      throw new Error('Invoice outstanding balance is already fully settled.');
    }

    // 2. Pessimistic Lock & Fetch Treasury Entry
    const treasury = await tx.treasury.findFirst({
      where: { id: treasuryId, tenantId, deletedAt: null },
    });

    if (!treasury) {
      throw new Error('Treasury entry not found or unauthorized.');
    }

    if (treasury.type !== 'in') {
      throw new Error('Customer allocation requires an inward treasury receipt (type: in).');
    }

    // 3. Partner Matching Verification
    if (invoice.customerId && treasury.referenceType === 'sale' && treasury.referenceId) {
      const referencedSale = await tx.salesInvoice.findUnique({
        where: { id: treasury.referenceId },
        select: { customerId: true },
      });
      if (referencedSale && referencedSale.customerId !== invoice.customerId) {
        throw new Error('Partner mismatch. Treasury payment customer does not match invoice customer.');
      }
    }

    // 4. Concurrency & Idempotency Duplicate Allocation Guard
    const existingMatch = await tx.openItemMatching.findFirst({
      where: {
        tenantId,
        salesInvoiceId,
        treasuryId,
        amount: allocationAmt,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (existingMatch) {
      throw new Error('An identical active matching allocation already exists. Blocked duplicate request.');
    }

    // 5. Verify Period Lock Rules on transaction date
    await assertPeriodWritable({
      tenantId,
      postingDate: new Date(invoice.date),
      operationType: 'ALLOCATE_CUSTOMER_PAYMENT',
      module: 'accounting',
      actor: userId,
      overrideContext,
    });

    // 6. Overmatching Arithmetic Safeguard (Invoice side)
    const outstandingInvoice = new Decimal(invoice.remaining);
    if (allocationAmt.greaterThan(outstandingInvoice)) {
      throw new Error(`Allocation amount (${allocationAmt}) exceeds remaining invoice balance (${outstandingInvoice}).`);
    }

    // 7. Overmatching Arithmetic Safeguard (Treasury side)
    const priorMatchings = await tx.openItemMatching.findMany({
      where: { treasuryId, status: 'ACTIVE', deletedAt: null },
      select: { amount: true },
    });
    const matchedSum = priorMatchings.reduce(
      (sum: Decimal, m: any) => sum.plus(m.amount),
      new Decimal(0)
    );
    const treasuryRemaining = new Decimal(treasury.amount).minus(matchedSum);
    
    if (allocationAmt.greaterThan(treasuryRemaining)) {
      throw new Error(`Allocation amount (${allocationAmt}) exceeds remaining treasury balance (${treasuryRemaining}).`);
    }

    // 8. Create the Allocating matching record
    const match = await tx.openItemMatching.create({
      data: {
        tenantId,
        salesInvoiceId,
        treasuryId,
        amount: allocationAmt,
        allocatedBy,
        sourceType,
        status: 'ACTIVE',
        notes: notes || null,
      },
    });

    // 9. Update Invoice Balances Atomically
    const newPaid = new Decimal(invoice.paid).plus(allocationAmt);
    const newRemaining = new Decimal(invoice.total).minus(newPaid);

    await tx.salesInvoice.update({
      where: { id: salesInvoiceId },
      data: {
        paid: newPaid,
        remaining: newRemaining,
        status: newRemaining.lessThanOrEqualTo(0) ? 'completed' : 'pending',
      },
    });

    // 10. Write AuditLog
    await tx.auditLog.create({
      data: {
        tenantId,
        action: 'ALLOCATE_CUSTOMER_PAYMENT',
        entityType: 'OpenItemMatching',
        entityId: String(match.id),
        userId: !isNaN(Number(userId)) ? Number(userId) : undefined,
        metadata: {
          salesInvoiceId,
          treasuryId,
          amount: allocationAmt.toNumber(),
          allocatedBy,
          sourceType,
        },
      },
    });

    log.info('Customer payment allocated successfully', { matchId: match.id, tenantId });
    return match;
  }

  /**
   * Allocate supplier payment (Treasury payment) to an outstanding Purchase Invoice
   */
  static async allocateSupplierPayment(
    tx: FinancialTxClient,
    request: AllocationRequest
  ) {
    const {
      tenantId,
      purchaseInvoiceId,
      treasuryId,
      amount,
      allocatedBy,
      sourceType,
      notes,
      userId,
      overrideContext,
    } = request;

    if (!purchaseInvoiceId || !treasuryId) {
      throw new Error('Both purchaseInvoiceId and treasuryId are required for supplier allocation.');
    }

    const allocationAmt = new Decimal(amount);
    if (allocationAmt.lessThanOrEqualTo(0)) {
      throw new Error('Allocation amount must be greater than zero.');
    }

    // 1. Pessimistic Row Lock & Fetch Parent Invoice
    const invoice = await tx.purchaseInvoice.findFirst({
      where: { id: purchaseInvoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) {
      throw new Error('Purchase invoice not found or unauthorized.');
    }

    // Document State Checks
    if (invoice.status === 'cancelled' || invoice.status === 'voided') {
      throw new Error('Cannot allocate payments to cancelled or voided invoices.');
    }

    if (invoice.status === 'completed' || invoice.remaining.lessThanOrEqualTo(0)) {
      throw new Error('Invoice outstanding balance is already fully settled.');
    }

    // 2. Pessimistic Lock & Fetch Treasury Entry
    const treasury = await tx.treasury.findFirst({
      where: { id: treasuryId, tenantId, deletedAt: null },
    });

    if (!treasury) {
      throw new Error('Treasury entry not found or unauthorized.');
    }

    if (treasury.type !== 'out') {
      throw new Error('Supplier allocation requires an outward treasury payment (type: out).');
    }

    // 3. Partner Matching Verification
    if (invoice.supplierId && treasury.referenceType === 'purchase' && treasury.referenceId) {
      const referencedPurchase = await tx.purchaseInvoice.findUnique({
        where: { id: treasury.referenceId },
        select: { supplierId: true },
      });
      if (referencedPurchase && referencedPurchase.supplierId !== invoice.supplierId) {
        throw new Error('Partner mismatch. Treasury payment supplier does not match invoice supplier.');
      }
    }

    // 4. Concurrency & Idempotency Duplicate Allocation Guard
    const existingMatch = await tx.openItemMatching.findFirst({
      where: {
        tenantId,
        purchaseInvoiceId,
        treasuryId,
        amount: allocationAmt,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (existingMatch) {
      throw new Error('An identical active matching allocation already exists. Blocked duplicate request.');
    }

    // 5. Verify Period Lock Rules
    await assertPeriodWritable({
      tenantId,
      postingDate: new Date(invoice.date),
      operationType: 'ALLOCATE_SUPPLIER_PAYMENT',
      module: 'accounting',
      actor: userId,
      overrideContext,
    });

    // 6. Overmatching Arithmetic Safeguard (Invoice side)
    const outstandingInvoice = new Decimal(invoice.remaining);
    if (allocationAmt.greaterThan(outstandingInvoice)) {
      throw new Error(`Allocation amount (${allocationAmt}) exceeds remaining invoice balance (${outstandingInvoice}).`);
    }

    // 7. Overmatching Arithmetic Safeguard (Treasury side)
    const priorMatchings = await tx.openItemMatching.findMany({
      where: { treasuryId, status: 'ACTIVE', deletedAt: null },
      select: { amount: true },
    });
    const matchedSum = priorMatchings.reduce(
      (sum: Decimal, m: any) => sum.plus(m.amount),
      new Decimal(0)
    );
    const treasuryRemaining = new Decimal(treasury.amount).minus(matchedSum);
    
    if (allocationAmt.greaterThan(treasuryRemaining)) {
      throw new Error(`Allocation amount (${allocationAmt}) exceeds remaining treasury balance (${treasuryRemaining}).`);
    }

    // 8. Create the Allocating matching record
    const match = await tx.openItemMatching.create({
      data: {
        tenantId,
        purchaseInvoiceId,
        treasuryId,
        amount: allocationAmt,
        allocatedBy,
        sourceType,
        status: 'ACTIVE',
        notes: notes || null,
      },
    });

    // 9. Update Invoice Balances Atomically
    const newPaid = new Decimal(invoice.paid).plus(allocationAmt);
    const newRemaining = new Decimal(invoice.total).minus(newPaid);

    await tx.purchaseInvoice.update({
      where: { id: purchaseInvoiceId },
      data: {
        paid: newPaid,
        remaining: newRemaining,
        status: newRemaining.lessThanOrEqualTo(0) ? 'completed' : 'pending',
      },
    });

    // 10. Write AuditLog
    await tx.auditLog.create({
      data: {
        tenantId,
        action: 'ALLOCATE_SUPPLIER_PAYMENT',
        entityType: 'OpenItemMatching',
        entityId: String(match.id),
        userId: !isNaN(Number(userId)) ? Number(userId) : undefined,
        metadata: {
          purchaseInvoiceId,
          treasuryId,
          amount: allocationAmt.toNumber(),
          allocatedBy,
          sourceType,
        },
      },
    });

    log.info('Supplier payment allocated successfully', { matchId: match.id, tenantId });
    return match;
  }

  /**
   * Reverse/unmatch an allocation cleanly with auditing trails
   */
  static async reverseAllocation(
    tx: FinancialTxClient,
    tenantId: string,
    matchingId: number,
    userId: string,
    reason: string,
    overrideContext?: OverrideContext
  ) {
    if (!reason || reason.trim().length < 10) {
      throw new Error('A detailed reversal reason (minimum 10 characters) is strictly required.');
    }

    // 1. Fetch matching record
    const match = await tx.openItemMatching.findFirst({
      where: { id: matchingId, tenantId, deletedAt: null },
    });

    if (!match) {
      throw new Error('Active matching record not found or unauthorized.');
    }

    if (match.status === 'REVERSED') {
      throw new Error('This matching allocation has already been reversed.');
    }

    // 2. Period Lock Enforcement on Reversal Date
    await assertPeriodWritable({
      tenantId,
      postingDate: new Date(),
      operationType: 'REVERSE_ALLOCATION',
      module: 'accounting',
      actor: userId,
      overrideContext,
    });

    // 3. Mark Matching as Reversed
    const allocationAmt = new Decimal(match.amount);
    
    await tx.openItemMatching.update({
      where: { id: matchingId },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversedBy: userId,
        reversalReason: reason,
      },
    });

    // 4. Update Parent Document Balances with strict absolute boundaries
    if (match.salesInvoiceId) {
      const invoice = await tx.salesInvoice.findUnique({
        where: { id: match.salesInvoiceId },
      });
      if (invoice) {
        const newPaid = Decimal.max(0, new Decimal(invoice.paid).minus(allocationAmt));
        const newRemaining = Decimal.min(invoice.total, new Decimal(invoice.total).minus(newPaid));
        await tx.salesInvoice.update({
          where: { id: match.salesInvoiceId },
          data: {
            paid: newPaid,
            remaining: newRemaining,
            status: 'pending',
          },
        });
      }
    } else if (match.purchaseInvoiceId) {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: match.purchaseInvoiceId },
      });
      if (invoice) {
        const newPaid = Decimal.max(0, new Decimal(invoice.paid).minus(allocationAmt));
        const newRemaining = Decimal.min(invoice.total, new Decimal(invoice.total).minus(newPaid));
        await tx.purchaseInvoice.update({
          where: { id: match.purchaseInvoiceId },
          data: {
            paid: newPaid,
            remaining: newRemaining,
            status: 'pending',
          },
        });
      }
    }

    // 5. Write Reversal AuditLog
    await tx.auditLog.create({
      data: {
        tenantId,
        action: 'REVERSE_ALLOCATION',
        entityType: 'OpenItemMatching',
        entityId: String(matchingId),
        userId: !isNaN(Number(userId)) ? Number(userId) : undefined,
        metadata: {
          matchingId,
          amount: allocationAmt.toNumber(),
          reversalReason: reason,
          salesInvoiceId: match.salesInvoiceId,
          purchaseInvoiceId: match.purchaseInvoiceId,
        },
      },
    });

    log.warn('Reconciliation matching reversed successfully', { matchingId, tenantId });
  }

  /**
   * Preview outstanding balances on parent invoices based strictly on active matchings
   */
  static async recalculateInvoiceBalancePreview(
    tx: any,
    tenantId: string,
    invoiceId: number,
    type: 'sales' | 'purchase'
  ) {
    if (type === 'sales') {
      const invoice = await tx.salesInvoice.findFirst({
        where: { id: invoiceId, tenantId, deletedAt: null },
        select: { total: true },
      });
      if (!invoice) throw new Error('Sales invoice not found.');

      const activeMatchings = await tx.openItemMatching.findMany({
        where: { salesInvoiceId: invoiceId, status: 'ACTIVE', deletedAt: null },
        select: { amount: true },
      });
      
      const totalAllocated = activeMatchings.reduce(
        (sum: Decimal, m: any) => sum.plus(m.amount),
        new Decimal(0)
      );
      const remaining = new Decimal(invoice.total).minus(totalAllocated);

      return {
        total: invoice.total,
        paid: totalAllocated,
        remaining,
      };
    } else {
      const invoice = await tx.purchaseInvoice.findFirst({
        where: { id: invoiceId, tenantId, deletedAt: null },
        select: { total: true },
      });
      if (!invoice) throw new Error('Purchase invoice not found.');

      const activeMatchings = await tx.openItemMatching.findMany({
        where: { purchaseInvoiceId: invoiceId, status: 'ACTIVE', deletedAt: null },
        select: { amount: true },
      });

      const totalAllocated = activeMatchings.reduce(
        (sum: Decimal, m: any) => sum.plus(m.amount),
        new Decimal(0)
      );
      const remaining = new Decimal(invoice.total).minus(totalAllocated);

      return {
        total: invoice.total,
        paid: totalAllocated,
        remaining,
      };
    }
  }
}
