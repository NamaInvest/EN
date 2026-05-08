import { z } from 'zod';

// ── Shared Primitives ──
const numericId = z.union([z.number().int(), z.string().transform(val => parseInt(val, 10)).pipe(z.number().int())]);

const nonNegativeAmount = z.union([
    z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً'),
    z.string().transform(val => parseFloat(val)).pipe(z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً'))
]);

export const amountSchema = z.union([
    z.number().positive('المبلغ يجب أن يكون رقماً موجباً أكبر من صفر'),
    z.string().transform(val => parseFloat(val)).pipe(z.number().positive('المبلغ يجب أن يكون رقماً موجباً أكبر من صفر'))
]);

const optionalString = z.string().optional().nullable();
const optionalId = numericId.optional().nullable();

// ── Treasury ──
export const treasuryCreateSchema = z.object({
  type: z.enum(['in', 'out']),
  amount: amountSchema,
  description: optionalString,
  referenceType: z.string().optional().default('manual'),
  referenceId: z.union([z.number(), z.string()]).optional().nullable(),
  userId: optionalId,
  branchId: optionalId,
});

// ── Expenses ──
export const expenseCreateSchema = z.object({
  category: z.string().min(1, 'بند المصروف مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  amount: amountSchema,
  notes: optionalString,
  costCenterId: optionalId,
  userId: optionalId,
  branchId: optionalId,
});

export const expenseUpdateSchema = z.object({
  id: numericId,
  category: z.string().optional(),
  description: z.string().optional(),
  amount: amountSchema.optional(),
  notes: optionalString,
  costCenterId: optionalId,
});

// ── Sales Invoices ──
const salesItemSchema = z.object({
  productId: numericId,
  productName: z.string().optional().default(''),
  quantity: nonNegativeAmount,
  price: nonNegativeAmount,
  discountRate: nonNegativeAmount.optional().default(0),
  discountValue: nonNegativeAmount.optional().default(0),
  taxRate: nonNegativeAmount.optional().default(15),
  batchId: optionalId,
  variantId: optionalId,
});

export const salesCreateSchema = z.object({
  customerId: optionalId,
  stockId: optionalId,
  paymentType: z.enum(['cash', 'credit', 'transfer', 'card', 'split']).optional().default('cash'),
  paid: nonNegativeAmount.optional().default(0),
  splitCash: nonNegativeAmount.optional(),
  splitCard: nonNegativeAmount.optional(),
  notes: optionalString,
  items: z.array(salesItemSchema).min(1, 'يجب أن تحتوي الفاتورة على صنف واحد على الأقل'),
  userId: optionalId,
  branchId: optionalId,
  shiftId: optionalId,
  salesRepId: optionalId,
  costCenterId: optionalId,
  currencyId: optionalId,
  exchangeRate: z.number().or(z.string().transform(Number)).optional(),
}).strip();

// ── Purchases ──
const purchaseItemSchema = z.object({
  productId: numericId,
  productName: z.string().optional().default(''),
  quantity: nonNegativeAmount,
  price: nonNegativeAmount,
  discountRate: nonNegativeAmount.optional().default(0),
});

export const purchaseCreateSchema = z.object({
  supplierId: optionalId,
  stockId: optionalId,
  paymentType: z.enum(['cash', 'credit', 'transfer', 'card', 'split']).optional().default('cash'),
  paid: nonNegativeAmount.optional(),
  notes: optionalString,
  supplierInvoiceNo: optionalString,
  receiptStatus: z.string().optional().default('received'),
  isManual: z.boolean().optional().default(false),
  manualSubtotal: nonNegativeAmount.optional(),
  manualTaxValue: nonNegativeAmount.optional(),
  items: z.array(purchaseItemSchema).min(0),
  userId: optionalId,
  branchId: optionalId,
  purchaseOrderId: optionalId,
  ppvAmount: z.number().or(z.string().transform(Number)).optional().nullable(),
}).strip();

export const purchasePaymentSchema = z.object({
  invoiceId: numericId,
  amount: amountSchema,
  userId: optionalId,
});

// ── Purchase Returns ──
export const purchaseReturnCreateSchema = z.object({
  originalInvoiceId: optionalId,
  supplierId: optionalId,
  subtotal: nonNegativeAmount,
  notes: optionalString,
  userId: optionalId,
  branchId: optionalId,
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
  originalInvoiceId: optionalId,
  customerId: optionalId,
  items: z.array(returnItemSchema).min(1, 'يجب أن يحتوي المرتجع على صنف واحد على الأقل'),
  notes: optionalString,
  userId: optionalId,
  branchId: optionalId,
  destinationStockId: optionalId,
  restockingFee: z.number().or(z.string().transform(Number)).optional().nullable(),
}).strip();

// ── Salaries ──
export const salaryCreateSchema = z.object({
  employeeId: numericId,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  basicSalary: nonNegativeAmount,
  additions: nonNegativeAmount.optional().default(0),
  deductions: nonNegativeAmount.optional().default(0),
  notes: optionalString,
  userId: optionalId,
}).strip();

// ── Journal Entries ──
const journalLineSchema = z.object({
  accountId: numericId,
  debit: nonNegativeAmount.optional().default(0),
  credit: nonNegativeAmount.optional().default(0),
  description: optionalString,
  costCenterId: optionalId,
  profitCenterId: optionalId,
  projectId: optionalId,
  segmentId: optionalId,
});

export const journalCreateSchema = z.object({
  entryDate: z.string().min(1, 'تاريخ القيد مطلوب'),
  description: optionalString,
  reference: optionalString,
  lines: z.array(journalLineSchema).min(2, 'القيد يجب أن يحتوي على سطرين على الأقل'),
  branchId: optionalId,
  currencyId: optionalId,
  exchangeRate: z.number().or(z.string().transform(Number)).optional(),
}).strip().refine(
  (data) => {
    const totalDebit = data.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = data.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: 'مجموع المدين يجب أن يساوي مجموع الدائن' }
);

// ── Customers ──
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  phone: optionalString,
  email: z.string().email('بريد إلكتروني غير صالح').optional().nullable().or(z.literal('')),
  address: optionalString,
  taxNumber: optionalString,
  creditLimit: nonNegativeAmount.optional().default(0),
  type: z.enum(['customer', 'supplier', 'both']).optional().default('customer'),
}).strip();

// ── Products ──
export const productCreateSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  barcode: optionalString,
  sku: optionalString,
  price: nonNegativeAmount.optional().default(0),
  cost: nonNegativeAmount.optional().default(0),
  category: optionalString,
  unit: z.string().optional().default('حبة'),
  taxRate: nonNegativeAmount.optional().default(15),
  trackStock: z.boolean().optional().default(true),
}).strip();

// ── Accounts ──
export const accountCreateSchema = z.object({
  code: z.string().min(1, 'رمز الحساب مطلوب'),
  name: z.string().min(1, 'اسم الحساب مطلوب'),
  nameEn: z.string().optional().default(''),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  parentId: z.number().int().optional().default(0),
  level: z.number().int().optional().default(1),
}).strip();

// ── Stock Transfers ──
export const stockTransferSchema = z.object({
  fromStockId: numericId,
  toStockId: numericId,
  items: z.array(z.object({
    productId: numericId,
    productName: z.string().optional().default(''),
    quantity: amountSchema,
  })).min(1, 'يجب تحديد صنف واحد على الأقل'),
  notes: optionalString,
  userId: optionalId,
}).strip();

// ── Generic Pagination Query ──
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1' as any),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(200)).optional().default('50' as any),
  search: optionalString,
  sortBy: optionalString,
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
});
