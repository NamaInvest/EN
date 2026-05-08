/**
 * Prisma Soft Delete Middleware
 * 
 * Automatically filters out soft-deleted records and converts
 * delete operations to soft deletes.
 * 
 * Usage: import and attach in your getPrisma() function
 */

import { Prisma } from '@prisma/client';

// Models that support soft delete
const SOFT_DELETE_MODELS = new Set([
  'SalesInvoice', 'PurchaseInvoice', 'JournalEntry',
  'Customer', 'Employee', 'Product', 'ProductUnit',
  'Asset', 'Salary', 'SalesReturn', 'PurchaseReturn',
  'PriceQuote', 'BankAccount', 'Booking',
  'Subscription', 'StockMovement',
  'Company', 'Branch', 'CostCenter',
  'Account', 'Contact',
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
      if (params.args.data) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }

    return next(params);
  });
}

/**
 * Hard delete — bypasses soft delete middleware
 * Use when you actually need to remove data permanently
 */
export async function hardDelete(prisma: any, model: string, where: any) {
  return prisma[model].delete({ where });
}
