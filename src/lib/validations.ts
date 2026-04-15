import { z } from 'zod';

// Strict numeric ID parser (accepts number or numeric string)
const numericId = z.union([z.number().int(), z.string().transform(val => parseInt(val, 10)).pipe(z.number().int())]);

// Non-negative amount (0 allowed for some cases)
const nonNegativeAmount = z.union([
    z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً'),
    z.string().transform(val => parseFloat(val)).pipe(z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً'))
]);

export const amountSchema = z.union([
    z.number().positive('المبلغ يجب أن يكون رقماً موجباً أكبر من صفر'),
    z.string().transform(val => parseFloat(val)).pipe(z.number().positive('المبلغ يجب أن يكون رقماً موجباً أكبر من صفر'))
]);

// ── Treasury ──
export const treasuryCreateSchema = z.object({
  type: z.enum(['in', 'out']),
  amount: amountSchema,
  description: z.string().optional().nullable(),
  referenceType: z.string().optional().default('manual'),
  referenceId: z.union([z.number(), z.string()]).optional().nullable(),
  userId: numericId.optional().nullable(),
  branchId: numericId.optional().nullable(),
});

// ── Expenses ──
export const expenseCreateSchema = z.object({
  category: z.string().min(1, 'بند المصروف مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  amount: amountSchema,
  notes: z.string().optional().nullable(),
  costCenterId: numericId.optional().nullable(),
  userId: numericId.optional().nullable(),
  branchId: numericId.optional().nullable(),
});

export const expenseUpdateSchema = z.object({
  id: numericId,
  category: z.string().optional(),
  description: z.string().optional(),
  amount: amountSchema.optional(),
  notes: z.string().optional().nullable(),
  costCenterId: numericId.optional().nullable(),
});

// ── Purchases ──
const purchaseItemSchema = z.object({
  productId: numericId,
  productName: z.string().optional().default(''),
  quantity: nonNegativeAmount,
  price: nonNegativeAmount,
  discountRate: nonNegativeAmount.optional().default(0),
});

export const purchaseCreateSchema = z.object({
  supplierId: numericId.optional().nullable(),
  stockId: numericId.optional().nullable(),
  paymentType: z.enum(['cash', 'credit', 'transfer', 'card', 'split']).optional().default('cash'),
  paid: nonNegativeAmount.optional(),
  notes: z.string().optional().nullable(),
  supplierInvoiceNo: z.string().optional().nullable(),
  receiptStatus: z.string().optional().default('received'),
  isManual: z.boolean().optional().default(false),
  manualSubtotal: nonNegativeAmount.optional(),
  manualTaxValue: nonNegativeAmount.optional(),
  items: z.array(purchaseItemSchema).min(0),
  userId: numericId.optional().nullable(),
  branchId: numericId.optional().nullable(),
}).strip(); // strip unknown fields to prevent mass-assignment

export const purchasePaymentSchema = z.object({
  invoiceId: numericId,
  amount: amountSchema,
  userId: numericId.optional().nullable(),
});

// ── Purchase Returns ──
export const purchaseReturnCreateSchema = z.object({
  originalInvoiceId: numericId.optional().nullable(),
  supplierId: numericId.optional().nullable(),
  subtotal: nonNegativeAmount,
  notes: z.string().optional().nullable(),
  userId: numericId.optional().nullable(),
  branchId: numericId.optional().nullable(),
}).strip();

// ── Sales Returns ──
const returnItemSchema = z.object({
  productId: numericId,
  productName: z.string().optional().default(''),
  quantity: amountSchema,
  price: nonNegativeAmount,
  discountRate: nonNegativeAmount.optional().default(0),
});

export const salesReturnCreateSchema = z.object({
  originalInvoiceId: numericId.optional().nullable(),
  customerId: numericId.optional().nullable(),
  items: z.array(returnItemSchema).min(1, 'يجب أن يحتوي المرتجع على صنف واحد على الأقل'),
  notes: z.string().optional().nullable(),
  userId: numericId.optional().nullable(),
  branchId: numericId.optional().nullable(),
}).strip();

// ── Salaries ──
export const salaryCreateSchema = z.object({
  employeeId: numericId,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  basicSalary: nonNegativeAmount,
  additions: nonNegativeAmount.optional().default(0),
  deductions: nonNegativeAmount.optional().default(0),
  notes: z.string().optional().nullable(),
  userId: numericId.optional().nullable(),
}).strip();
