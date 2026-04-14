/**
 * src/lib/types.ts
 * ──────────────────────────────────────────────────────────
 * أنواع TypeScript المشتركة في المشروع
 * استخدم هذه الأنواع بدلاً من `any` في API routes
 */

// ── المستخدم ──
export interface AuthUser {
    userId: number;
    username: string;
    role: 'admin' | 'manager' | 'cashier' | 'viewer' | string;
    branchId?: number | null;
}

// ── المنتج ──
export interface ProductBase {
    id: number;
    name: string;
    barcode?: string | null;
    sellPrice: number;
    cost?: number | null;
    unit?: string | null;
    categoryId?: number | null;
    taxRate?: number | null;
}

// ── عنصر الفاتورة ──
export interface InvoiceItem {
    productId: number;
    productName?: string;
    quantity: number;
    price: number;
    discount?: number;
    taxAmount?: number;
    total: number;
    barcode?: string | null;
    unit?: string | null;
    batchId?: number | null;
    expiryDate?: string | null;
}

// ── الفاتورة ──
export interface SaleInvoice {
    id?: number;
    invoiceNumber?: string;
    customerId?: number | null;
    userId?: number | null;
    branchId?: number | null;
    items: InvoiceItem[];
    subtotal: number;
    discount?: number;
    taxAmount?: number;
    total: number;
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'credit' | string;
    paidAmount?: number;
    notes?: string | null;
    date?: string;
}

// ── العميل ──
export interface Customer {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxNumber?: string | null;
    address?: string | null;
    creditLimit?: number | null;
    balance?: number;
}

// ── الموظف ──
export interface Employee {
    id: number;
    name: string;
    phone?: string | null;
    position?: string | null;
    salary: number;
    housingAllowance?: number;
    transportAllowance?: number;
    otherAllowance?: number;
    bankName?: string | null;
    iban?: string | null;
    startDate?: string | null;
    branchId?: number | null;
}

// ── المصروف ──
export interface Expense {
    id?: number;
    category: string;
    description: string;
    amount: number;
    userId?: number | null;
    branchId?: number | null;
    notes?: string | null;
    costCenterId?: number | null;
    date?: string;
}

// ── حركة المخزون ──
export interface StockMovement {
    productId: number;
    stockId: number;
    type: 'in' | 'out' | 'transit_in' | 'transit_out' | 'adjustment' | string;
    quantity: number;
    notes?: string | null;
    userId?: number | null;
    referenceId?: number | null;
    date?: Date;
}

// ── الفرع ──
export interface Branch {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    managerId?: number | null;
}

// ── استجابة API عامة ──
export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success?: boolean;
    message?: string;
    count?: number;
}

// ── فلاتر البحث ──
export interface DateRangeFilter {
    from?: string;
    to?: string;
    branchId?: number;
    search?: string;
}

// ── عرض السعر ──
export interface PriceQuoteItem {
    productId: number | null;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
}

export interface PriceQuote {
    id?: number;
    customerId?: number | null;
    items: PriceQuoteItem[];
    subtotal: number;
    taxAmount?: number;
    total: number;
    validDays?: number;
    notes?: string | null;
    status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';
}

// ── بنك ──
export interface BankTransaction {
    type: 'deposit' | 'withdrawal' | 'transfer';
    amount: number;
    description?: string | null;
    referenceType?: string;
    referenceId?: number | null;
    date?: string;
}
