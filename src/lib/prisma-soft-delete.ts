/**
 * Prisma Soft Delete Middleware
 * 
 * Automatically filters out soft-deleted records and converts
 * delete operations to soft deletes.
 * 
 * Usage: import and attach in your getPrisma() function
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prisma-soft-delete' });

// Models that support soft delete
// P1.2 — expanded to cover all financial + operational models
const SOFT_DELETE_MODELS = new Set([
  // Pre-existing
  'SalesInvoice', 'PurchaseInvoice', 'JournalEntry',
  'Customer', 'Employee', 'Product', 'ProductUnit',
  'Asset', 'Salary', 'SalesReturn', 'PurchaseReturn',
  'PriceQuote', 'Booking', 'StockMovement',
  'Branch', 'Account',
  // Added P1.2 (2026-05-10)
  'User', 'JournalLine', 'Treasury',
  'PurchaseOrder', 'PurchaseOrderDetail',
  'PurchaseInvoiceDetail', 'SalesInvoiceDetail',
  'InstallmentPayment', 'EmployeeLoan',
  'PayrollInvoice', 'PayrollInvoiceDetail',
  'PurchaseRequisition', 'RentInvoice', 'RentInvoiceDetail',
  'PaymentRun', 'PaymentRunLine', 'PaymentTransaction',
]);

/**
 * Apply soft delete middleware to a Prisma client instance
 */
export function applySoftDeleteMiddleware(prisma: any) {
  prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    // Only apply to models with soft delete support
    if (!params.model || !SOFT_DELETE_MODELS.has(params.model)) {
      return next(params);
    }

    // ── READ operations: filter out deleted records ──
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      // Change findUnique to findFirst so we can add deletedAt filter
      if (params.action === 'findUnique') {
        params.action = 'findFirst';
      }
      // Add deletedAt: null filter unless explicitly looking for deleted
      if (!params.args?.where?.deletedAt) {
        params.args = params.args || {};
        params.args.where = { ...params.args.where, deletedAt: null };
      }
    }

    if (params.action === 'findMany') {
      // Add deletedAt: null filter unless explicitly querying deleted
      if (!params.args?.where?.deletedAt && !params.args?.where?.OR?.some?.((c: any) => c.deletedAt !== undefined)) {
        params.args = params.args || {};
        params.args.where = { ...params.args.where, deletedAt: null };
      }
    }

    if (params.action === 'count') {
      if (!params.args?.where?.deletedAt) {
        params.args = params.args || {};
        params.args.where = { ...params.args.where, deletedAt: null };
      }
    }

    // ── DELETE operations: convert to soft delete ──
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      // Only soft-delete records that haven't been deleted yet
      params.args.where = { ...params.args.where, deletedAt: null };
      params.args.data = { deletedAt: new Date() };
    }

    return next(params);
  });
}

/**
 * Restore a soft-deleted record
 * Usage: await restoreRecord(prisma, 'User', { id: '...' })
 */
export async function restoreRecord(
  prisma: any,
  model: string,
  where: Record<string, any>
): Promise<any> {
  const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
  return (prisma[modelKey] as any).updateMany({
    where: { ...where, deletedAt: { not: null } },
    data:  { deletedAt: null },
  });
}

/**
 * Hard delete — bypasses soft delete middleware
 * ADMIN ONLY — must be logged in AuditLog before calling
 */
export async function hardDelete(prisma: any, model: string, where: any) {
  // Use $executeRawUnsafe to bypass Prisma middleware
  const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
  // First find the record (including deleted)
  const record = await (prisma[modelKey] as any).findFirst({ where });
  if (!record) throw new Error(`Record not found in ${model}`);
  // Then hard delete via raw SQL
  return prisma.$executeRawUnsafe(
    `DELETE FROM "${model}" WHERE id = $1`,
    record.id
  );
}
