import { describe, it, expect } from '@jest/globals';
import { n } from '@/lib/decimal-utils';

// Mock types representing the data models
type CustomerFixture = {
  id: number;
  name: string;
  active: boolean;
  creditLimit: number;
  balance: number;
  creditHold: boolean;
  creditHoldReason: string | null;
};

type SalesInvoiceFixture = {
  customerId: number;
  paymentType: string;
  items: Array<{ price: number; quantity: number }>;
  paid?: number;
};

// Simulation of Sales Invoice API validation logic
function validateSalesInvoice(customer: CustomerFixture, invoice: SalesInvoiceFixture): { allowed: boolean; error?: string; code?: string } {
  if (!customer.active) {
    return {
      allowed: false,
      error: `العميل "${customer.name}" غير نشط. لا يمكن إتمام المعاملة.`,
      code: 'CUSTOMER_INACTIVE'
    };
  }

  const paymentType = invoice.paymentType || 'cash';
  if (paymentType !== 'cash' && customer.creditHold) {
    return {
      allowed: false,
      error: `العميل "${customer.name}" موقوف ائتمانياً. السبب: ${customer.creditHoldReason || 'غير محدد'}`,
      code: 'CREDIT_HOLD_ACTIVE'
    };
  }

  if (n(customer.creditLimit) > 0) {
    let estTotal = 0;
    for (const item of invoice.items) {
      estTotal += item.price * item.quantity;
    }
    const paid = invoice.paid !== undefined ? invoice.paid : estTotal;
    const willBeOwed = estTotal - paid;
    const currentBalance = n(customer.balance);

    if (paymentType !== 'cash' && (currentBalance + willBeOwed) > n(customer.creditLimit)) {
      return {
        allowed: false,
        error: `تجاوز حد الائتمان — العميل "${customer.name}" لديه رصيد مديون ${currentBalance.toFixed(2)} ر.س والحد المسموح ${n(customer.creditLimit).toFixed(2)} ر.س. المبلغ الإضافي المطلوب: ${willBeOwed.toFixed(2)} ر.س`,
        code: 'CREDIT_LIMIT_EXCEEDED'
      };
    }
  }

  return { allowed: true };
}

// Simulation of POS Checkout API validation logic
function validatePosCheckout(customer: CustomerFixture, cartTotal: number, paymentMethod: string): { allowed: boolean; error?: string; code?: string } {
  if (!customer.active) {
    return {
      allowed: false,
      error: `العميل "${customer.name}" غير نشط. لا يمكن إتمام المعاملة.`,
      code: 'CUSTOMER_INACTIVE'
    };
  }

  const paymentMethodLower = String(paymentMethod).toLowerCase();
  const isCreditPayment = paymentMethodLower === 'credit' || paymentMethodLower === 'bnpl' || paymentMethodLower === 'on_account';

  if (isCreditPayment) {
    if (customer.creditHold) {
      return {
        allowed: false,
        error: `العميل "${customer.name}" موقوف ائتمانياً. السبب: ${customer.creditHoldReason || 'غير محدد'}`,
        code: 'CREDIT_HOLD_ACTIVE'
      };
    }

    if (n(customer.creditLimit) > 0) {
      const currentBalance = n(customer.balance);
      if ((currentBalance + cartTotal) > n(customer.creditLimit)) {
        return {
          allowed: false,
          error: `تجاوز حد الائتمان — العميل "${customer.name}" لديه رصيد مديون ${currentBalance.toFixed(2)} ر.س والحد المسموح ${n(customer.creditLimit).toFixed(2)} ر.س. المبلغ الإضافي المطلوب: ${cartTotal.toFixed(2)} ر.س`,
          code: 'CREDIT_LIMIT_EXCEEDED'
        };
      }
    }
  }

  return { allowed: true };
}

describe('Credit Control Validation Tests', () => {
  const activeCustomer: CustomerFixture = {
    id: 1,
    name: 'عميل نشط',
    active: true,
    creditLimit: 1000,
    balance: 200,
    creditHold: false,
    creditHoldReason: null
  };

  const inactiveCustomer: CustomerFixture = {
    id: 2,
    name: 'عميل غير نشط',
    active: false,
    creditLimit: 1000,
    balance: 0,
    creditHold: false,
    creditHoldReason: null
  };

  const creditHoldCustomer: CustomerFixture = {
    id: 3,
    name: 'عميل موقوف ائتمانياً',
    active: true,
    creditLimit: 1000,
    balance: 100,
    creditHold: true,
    creditHoldReason: 'تأخر سداد الفواتير'
  };

  // ─── Sales Invoice API Tests ───────────────────────────────────────────────

  describe('Sales Invoice API Credit Validation', () => {
    it('should reject inactive customer with CUSTOMER_INACTIVE error code', () => {
      const invoice: SalesInvoiceFixture = {
        customerId: 2,
        paymentType: 'credit',
        items: [{ price: 100, quantity: 1 }]
      };
      const res = validateSalesInvoice(inactiveCustomer, invoice);
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('CUSTOMER_INACTIVE');
      expect(res.error).toContain('غير نشط');
    });

    it('should reject non-cash invoice if customer is on creditHold', () => {
      const invoice: SalesInvoiceFixture = {
        customerId: 3,
        paymentType: 'credit',
        items: [{ price: 150, quantity: 1 }]
      };
      const res = validateSalesInvoice(creditHoldCustomer, invoice);
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('CREDIT_HOLD_ACTIVE');
      expect(res.error).toContain('موقوف ائتمانياً');
    });

    it('should reject non-cash invoice if balance + unpaid exceeds creditLimit', () => {
      const invoice: SalesInvoiceFixture = {
        customerId: 1,
        paymentType: 'credit',
        items: [{ price: 900, quantity: 1 }], // balance (200) + owed (900) = 1100 > creditLimit (1000)
        paid: 0
      };
      const res = validateSalesInvoice(activeCustomer, invoice);
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('CREDIT_LIMIT_EXCEEDED');
      expect(res.error).toContain('تجاوز حد الائتمان');
    });

    it('should allow cash invoice even if credit limit is exceeded', () => {
      const invoice: SalesInvoiceFixture = {
        customerId: 1,
        paymentType: 'cash',
        items: [{ price: 2000, quantity: 1 }],
        paid: 2000 // Fully paid in cash
      };
      const res = validateSalesInvoice(activeCustomer, invoice);
      expect(res.allowed).toBe(true);
    });

    it('should allow non-cash invoice for customers without credit limit (limit = 0)', () => {
      const noLimitCustomer = { ...activeCustomer, creditLimit: 0 };
      const invoice: SalesInvoiceFixture = {
        customerId: 1,
        paymentType: 'credit',
        items: [{ price: 5000, quantity: 1 }]
      };
      const res = validateSalesInvoice(noLimitCustomer, invoice);
      expect(res.allowed).toBe(true);
    });
  });

  // ─── POS Checkout API Tests ─────────────────────────────────────────────────

  describe('POS Checkout API Credit Validation', () => {
    it('should reject inactive customer at checkout', () => {
      const res = validatePosCheckout(inactiveCustomer, 100, 'credit');
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('CUSTOMER_INACTIVE');
    });

    it('should reject credit/bnpl/on_account checkout if customer is on creditHold', () => {
      const res = validatePosCheckout(creditHoldCustomer, 150, 'bnpl');
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('CREDIT_HOLD_ACTIVE');
    });

    it('should reject credit/bnpl/on_account if balance + finalTotal exceeds limit', () => {
      // balance (200) + checkout (900) = 1100 > limit (1000)
      const res = validatePosCheckout(activeCustomer, 900, 'on_account');
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('CREDIT_LIMIT_EXCEEDED');
    });

    it('should allow cash or card checkout even if creditLimit would be exceeded', () => {
      const res = validatePosCheckout(activeCustomer, 3000, 'cash');
      expect(res.allowed).toBe(true);
    });
  });
});
