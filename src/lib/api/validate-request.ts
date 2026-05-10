/**
 * Zod Validation Layer for API Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 *   1. validateRequest() — type-safe JSON body parsing with Zod
 *   2. Shared Zod schemas for all high-traffic financial endpoints
 *   3. Helper types for route handler responses
 *
 * Usage in a route:
 *   import { validateRequest, CreateSalesInvoiceSchema } from '@/lib/api/validate-request';
 *
 *   export async function POST(req: NextRequest) {
 *     const { data, error } = await validateRequest(req, CreateSalesInvoiceSchema);
 *     if (error) return error;
 *     // data is fully typed
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.api.validate' });

// ─── Core validate helper ─────────────────────────────────────────────────────

export async function validateRequest<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { data: null, error: NextResponse.json({ error: 'INVALID_JSON', message: 'Request body must be valid JSON' }, { status: 400 }) };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json({
        error: 'VALIDATION_ERROR',
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        })),
      }, { status: 400 }),
    };
  }
  return { data: result.data, error: null };
}

// ─── Query param helper ───────────────────────────────────────────────────────

export function validateQuery<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => { params[k] = v; });

  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json({
        error: 'QUERY_VALIDATION_ERROR',
        issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      }, { status: 400 }),
    };
  }
  return { data: result.data, error: null };
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const positiveDecimal = z.number().positive('Must be a positive number');
const nonEmptyString  = z.string().min(1, 'Cannot be empty');
const saudiDate       = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');
const tenantId        = z.string().default('default');
const optionalId      = z.number().int().positive().optional();
const requiredId      = z.number().int().positive();

// ─── Sales Schemas ────────────────────────────────────────────────────────────

export const SalesInvoiceItemSchema = z.object({
  productId: requiredId,
  quantity: positiveDecimal,
  price: positiveDecimal,
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(15),
  description: z.string().optional(),
});

export const CreateSalesInvoiceSchema = z.object({
  customerId: requiredId,
  date: saudiDate,
  branchId: optionalId,
  items: z.array(SalesInvoiceItemSchema).min(1, 'At least one line item required'),
  notes: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  referenceNo: z.string().optional(),
});

export const PostInvoiceSchema = z.object({ invoiceId: requiredId });

export const CreateSalesReturnSchema = z.object({
  originalInvoiceId: requiredId,
  reason: nonEmptyString,
  items: z.array(z.object({
    productId: requiredId,
    quantity: positiveDecimal,
    price: positiveDecimal,
  })).min(1),
});

// ─── Purchase Schemas ─────────────────────────────────────────────────────────

export const PurchaseOrderItemSchema = z.object({
  productId: requiredId,
  quantity: positiveDecimal,
  unitCost: positiveDecimal,
  taxRate: z.number().min(0).max(100).default(15),
  description: z.string().optional(),
});

export const CreatePurchaseOrderSchema = z.object({
  vendorId: requiredId,
  date: saudiDate,
  expectedDelivery: saudiDate.optional(),
  items: z.array(PurchaseOrderItemSchema).min(1),
  notes: z.string().optional(),
  branchId: optionalId,
});

export const ReceiveGRNSchema = z.object({
  purchaseOrderId: requiredId,
  receivedDate: saudiDate,
  items: z.array(z.object({
    productId: requiredId,
    receivedQuantity: positiveDecimal,
    unitCost: positiveDecimal,
  })).min(1),
  warehouseId: optionalId,
  notes: z.string().optional(),
});

// ─── Inventory Schemas ────────────────────────────────────────────────────────

export const StockTransferSchema = z.object({
  fromStockId: requiredId,
  toStockId: requiredId,
  items: z.array(z.object({ productId: requiredId, quantity: positiveDecimal })).min(1),
  notes: z.string().optional(),
});

export const StockAdjustmentSchema = z.object({
  productId: requiredId,
  warehouseId: requiredId,
  adjustedQuantity: z.number(), // can be negative for write-offs
  reason: nonEmptyString,
  unitCost: z.number().positive().optional(),
});

// ─── Payroll Schemas ──────────────────────────────────────────────────────────

export const RunPayrollSchema = z.object({
  year: z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
  branchId: optionalId,
});

export const PostPayrollSchema = z.object({
  year: z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
});

// ─── Journal Entry Schemas ────────────────────────────────────────────────────

export const JournalLineSchema = z.object({
  accountCode: nonEmptyString,
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional(),
  costCenterId: optionalId,
});

export const CreateJournalEntrySchema = z.object({
  entryDate: saudiDate,
  description: nonEmptyString,
  referenceNo: z.string().optional(),
  lines: z.array(JournalLineSchema).min(2, 'Journal entry needs at least 2 lines')
    .refine((lines) => {
      const totalDebit  = lines.reduce((s, l) => s + (l.debit ?? 0), 0);
      const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
      return Math.abs(totalDebit - totalCredit) < 0.001;
    }, 'Journal entry must balance (total debits = total credits)'),
  currencyCode: z.string().length(3).default('SAR'),
});

// ─── Payment Schemas ──────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  type: z.enum(['receipt', 'payment']),
  amount: positiveDecimal,
  date: saudiDate,
  bankAccountId: optionalId,
  customerId: optionalId,
  vendorId: optionalId,
  reference: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.customerId || d.vendorId, 'Either customerId or vendorId is required');

// ─── HR / Leave Schemas ───────────────────────────────────────────────────────

export const CreateLeaveRequestSchema = z.object({
  employeeId: requiredId,
  leaveType: z.enum(['annual', 'sick', 'emergency', 'maternity', 'paternity', 'unpaid']),
  startDate: saudiDate,
  endDate: saudiDate,
  reason: z.string().optional(),
}).refine((d) => d.startDate <= d.endDate, 'End date must be after start date');

// ─── Query Param Schemas ──────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page:  z.string().optional().transform((v) => Math.max(1, parseInt(v ?? '1', 10))),
  limit: z.string().optional().transform((v) => Math.min(100, Math.max(1, parseInt(v ?? '20', 10)))),
});

export const DateRangeSchema = z.object({
  from: saudiDate.optional(),
  to:   saudiDate.optional(),
});

export const TenantQuerySchema = z.object({
  tenantId: z.string().default('default'),
});
