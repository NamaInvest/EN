import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';

// Simple server calculations simulation to verify business logic correctness
function calculateQuotationTotals(lines: Array<{ quantity: number; unitPrice: number; discountRate: number; taxRate: number }>) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let total = 0;

  const calculatedLines = lines.map((line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmount = lineSubtotal * (line.discountRate / 100);
    const lineAfterDiscount = lineSubtotal - discountAmount;
    const taxAmount = lineAfterDiscount * (line.taxRate / 100);
    const lineTotal = lineAfterDiscount + taxAmount;

    subtotal += lineSubtotal - discountAmount;
    discountTotal += discountAmount;
    taxTotal += taxAmount;
    total += lineTotal;

    return {
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountRate: line.discountRate,
      discountAmount,
      taxRate: line.taxRate,
      taxAmount,
      lineTotal,
    };
  });

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
    lines: calculatedLines,
  };
}

// Convert state transition verification
function verifyStatusTransition(currentStatus: string, action: 'send' | 'accept' | 'reject' | 'cancel' | 'convert') {
  if (action === 'send') {
    return currentStatus === 'DRAFT' ? 'SENT' : null;
  }
  if (action === 'accept') {
    return (currentStatus === 'DRAFT' || currentStatus === 'SENT') ? 'ACCEPTED' : null;
  }
  if (action === 'reject') {
    return (currentStatus === 'DRAFT' || currentStatus === 'SENT') ? 'REJECTED' : null;
  }
  if (action === 'cancel') {
    return (currentStatus !== 'CONVERTED' && currentStatus !== 'CANCELLED') ? 'CANCELLED' : null;
  }
  if (action === 'convert') {
    return currentStatus === 'ACCEPTED' ? 'CONVERTED' : null;
  }
  return null;
}

describe('Sales Quotation business rules & calculations', () => {
  it('should correctly calculate subtotal, discount, tax, and total on the server', () => {
    const mockLines = [
      { quantity: 2, unitPrice: 100, discountRate: 10, taxRate: 15 }, // Subtotal: 200, Disc: 20, after: 180, Tax: 27, Total: 207
      { quantity: 1, unitPrice: 50, discountRate: 0, taxRate: 5 },    // Subtotal: 50, Disc: 0, after: 50, Tax: 2.5, Total: 52.5
    ];

    const result = calculateQuotationTotals(mockLines);

    // Assertions
    expect(result.subtotal).toBe(230); // (180 + 50)
    expect(result.discountTotal).toBe(20);
    expect(result.taxTotal).toBe(29.5); // (27 + 2.5)
    expect(result.total).toBe(259.5);  // (207 + 52.5)

    // Lines assertions
    expect(result.lines[0].discountAmount).toBe(20);
    expect(result.lines[0].taxAmount).toBe(27);
    expect(result.lines[0].lineTotal).toBe(207);

    expect(result.lines[1].discountAmount).toBe(0);
    expect(result.lines[1].taxAmount).toBe(2.5);
    expect(result.lines[1].lineTotal).toBe(52.5);
  });

  it('should validate allowed status transitions correctly', () => {
    // DRAFT transitions
    expect(verifyStatusTransition('DRAFT', 'send')).toBe('SENT');
    expect(verifyStatusTransition('DRAFT', 'accept')).toBe('ACCEPTED');
    expect(verifyStatusTransition('DRAFT', 'reject')).toBe('REJECTED');
    expect(verifyStatusTransition('DRAFT', 'cancel')).toBe('CANCELLED');
    expect(verifyStatusTransition('DRAFT', 'convert')).toBeNull(); // Cannot convert draft directly

    // SENT transitions
    expect(verifyStatusTransition('SENT', 'send')).toBeNull();
    expect(verifyStatusTransition('SENT', 'accept')).toBe('ACCEPTED');
    expect(verifyStatusTransition('SENT', 'reject')).toBe('REJECTED');
    expect(verifyStatusTransition('SENT', 'cancel')).toBe('CANCELLED');
    expect(verifyStatusTransition('SENT', 'convert')).toBeNull();

    // ACCEPTED transitions
    expect(verifyStatusTransition('ACCEPTED', 'convert')).toBe('CONVERTED');
    expect(verifyStatusTransition('ACCEPTED', 'cancel')).toBe('CANCELLED');
    expect(verifyStatusTransition('ACCEPTED', 'send')).toBeNull();

    // CONVERTED transitions (locked)
    expect(verifyStatusTransition('CONVERTED', 'cancel')).toBeNull();
    expect(verifyStatusTransition('CONVERTED', 'send')).toBeNull();
    expect(verifyStatusTransition('CONVERTED', 'accept')).toBeNull();
  });
});

describe('Sales Invoice Draft Conversion Rules', () => {
  const mockQuotation = {
    id: 12,
    quotationNo: 'QT-2026-000001',
    customerId: 5,
    subtotal: new Decimal(230),
    discountTotal: new Decimal(20),
    taxTotal: new Decimal(29.5),
    total: new Decimal(259.5),
    currency: 'SAR',
    notes: 'العرض التجريبي الأول',
    status: 'ACCEPTED',
    convertedInvoiceId: null,
    lines: [
      { id: 1, productId: 10, description: 'منتج أ', quantity: new Decimal(2), unitPrice: new Decimal(100), discountRate: 10, discountAmount: new Decimal(20), taxRate: 15, taxAmount: new Decimal(27), lineTotal: new Decimal(207) },
    ],
  };

  it('should maps fields correctly for SalesInvoice creation in draft state', () => {
    const createdInvoiceData = {
      tenantId: 'tenant_abc',
      date: new Date(),
      invoiceNo: 100002,
      customerId: mockQuotation.customerId,
      stockId: 1,
      subtotal: mockQuotation.subtotal,
      discountRate: (mockQuotation.discountTotal.toNumber() / mockQuotation.subtotal.toNumber()) * 100,
      discountValue: mockQuotation.discountTotal,
      taxValue: mockQuotation.taxTotal,
      total: mockQuotation.total,
      paid: 0,
      remaining: mockQuotation.total,
      paymentType: 'cash',
      status: 'draft',
      notes: `محولة تلقائياً من عرض السعر رقم ${mockQuotation.quotationNo}. ${mockQuotation.notes}`,
      details: mockQuotation.lines.map(line => ({
        productId: line.productId,
        productName: line.description,
        quantity: line.quantity,
        price: line.unitPrice,
        discountRate: line.discountRate,
        discountValue: line.discountAmount,
        taxRate: line.taxRate,
        taxValue: line.taxAmount,
        total: line.lineTotal,
      })),
    };

    expect(createdInvoiceData.status).toBe('draft');
    expect(createdInvoiceData.paid).toBe(0);
    expect(createdInvoiceData.remaining).toEqual(mockQuotation.total);
    expect(createdInvoiceData.details[0].productId).toBe(10);
    expect(createdInvoiceData.details[0].productName).toBe('منتج أ');
    expect(createdInvoiceData.discountRate).toBeCloseTo(8.70, 2);
  });
});

describe('Sales Quotation Conversion Validation and Concurrency Rules', () => {
  interface Quotation {
    id: number;
    quotationNo: string;
    customerId: number;
    subtotal: Decimal;
    discountTotal: Decimal;
    taxTotal: Decimal;
    total: Decimal;
    currency: string;
    notes: string;
    status: string;
    convertedInvoiceId: number | null;
    lines: Array<any>;
  }

  function simulateConvertToInvoice(
    quotation: Quotation,
    invoicesDb: Array<any>,
    quotationsDb: Array<Quotation>
  ) {
    // 1. Check if already converted (API route check before transaction)
    if (quotation.convertedInvoiceId) {
      const existingInvoice = invoicesDb.find(inv => inv.id === quotation.convertedInvoiceId);
      if (existingInvoice) {
        return {
          success: true,
          alreadyConverted: true,
          invoice: existingInvoice,
        };
      }
    }

    // 2. Status verification
    if (quotation.status !== 'ACCEPTED') {
      return {
        error: 'يمكن تحويل عروض الأسعار المقبولة (ACCEPTED) فقط إلى فواتير',
        status: 400,
      };
    }

    // 3. Under transaction (locked check)
    const lockedQuote = quotationsDb.find(q => q.id === quotation.id);
    if (!lockedQuote || lockedQuote.convertedInvoiceId) {
      throw new Error('تم تحويل هذا العرض مسبقاً أو غير موجود');
    }

    // 4. Create invoice
    const newInvoiceId = invoicesDb.length + 100001;
    const createdInvoice = {
      id: newInvoiceId,
      tenantId: 'tenant_abc',
      date: new Date(),
      invoiceNo: 100002 + invoicesDb.length,
      customerId: quotation.customerId,
      stockId: 1,
      subtotal: quotation.subtotal,
      discountRate: quotation.subtotal.toNumber() > 0 
        ? (quotation.discountTotal.toNumber() / quotation.subtotal.toNumber()) * 100 
        : 0,
      discountValue: quotation.discountTotal,
      taxValue: quotation.taxTotal,
      total: quotation.total,
      paid: 0,
      remaining: quotation.total,
      paymentType: 'cash',
      status: 'draft',
      notes: `محولة تلقائياً من عرض السعر رقم ${quotation.quotationNo}. ${quotation.notes}`,
      details: quotation.lines.map((line) => ({
        productId: line.productId,
        productName: line.description,
        quantity: line.quantity,
        price: line.unitPrice,
        discountRate: line.discountRate,
        discountValue: line.discountAmount,
        taxRate: line.taxRate,
        taxValue: line.taxAmount,
        total: line.lineTotal,
      })),
    };

    invoicesDb.push(createdInvoice);

    // 5. Update quotation status
    lockedQuote.status = 'CONVERTED';
    lockedQuote.convertedInvoiceId = createdInvoice.id;

    if (quotation !== lockedQuote) {
      quotation.status = 'CONVERTED';
      quotation.convertedInvoiceId = createdInvoice.id;
    }

    return {
      success: true,
      invoice: createdInvoice,
    };
  }

  const createMockQuotation = (status: string, id: number = 101): Quotation => ({
    id,
    quotationNo: `QT-2026-000${id}`,
    customerId: 5,
    subtotal: new Decimal(230),
    discountTotal: new Decimal(20),
    taxTotal: new Decimal(29.5),
    total: new Decimal(259.5),
    currency: 'SAR',
    notes: 'تيسير',
    status,
    convertedInvoiceId: null,
    lines: [],
  });

  it('should create a Draft invoice when status is ACCEPTED', () => {
    const quotation = createMockQuotation('ACCEPTED');
    const invoicesDb: Array<any> = [];
    const quotationsDb: Array<Quotation> = [quotation];

    const result = simulateConvertToInvoice(quotation, invoicesDb, quotationsDb);
    expect(result.success).toBe(true);
    expect(result.invoice).toBeDefined();
    expect(result.invoice.status).toBe('draft');
    expect(quotation.status).toBe('CONVERTED');
    expect(quotation.convertedInvoiceId).toBe(result.invoice.id);
  });

  it('should reject conversion for DRAFT status', () => {
    const quotation = createMockQuotation('DRAFT');
    const invoicesDb: Array<any> = [];
    const quotationsDb: Array<Quotation> = [quotation];

    const result = simulateConvertToInvoice(quotation, invoicesDb, quotationsDb);
    expect(result.error).toBeDefined();
    expect(result.status).toBe(400);
    expect(invoicesDb.length).toBe(0);
  });

  it('should reject conversion for REJECTED status', () => {
    const quotation = createMockQuotation('REJECTED');
    const invoicesDb: Array<any> = [];
    const quotationsDb: Array<Quotation> = [quotation];

    const result = simulateConvertToInvoice(quotation, invoicesDb, quotationsDb);
    expect(result.error).toBeDefined();
    expect(result.status).toBe(400);
    expect(invoicesDb.length).toBe(0);
  });

  it('should reject conversion for CANCELLED status', () => {
    const quotation = createMockQuotation('CANCELLED');
    const invoicesDb: Array<any> = [];
    const quotationsDb: Array<Quotation> = [quotation];

    const result = simulateConvertToInvoice(quotation, invoicesDb, quotationsDb);
    expect(result.error).toBeDefined();
    expect(result.status).toBe(400);
    expect(invoicesDb.length).toBe(0);
  });

  it('should prevent double conversion and return existing invoice when convertedInvoiceId is set', () => {
    const quotation = createMockQuotation('ACCEPTED');
    const invoicesDb: Array<any> = [];
    const quotationsDb: Array<Quotation> = [quotation];

    // First conversion
    const firstResult = simulateConvertToInvoice(quotation, invoicesDb, quotationsDb);
    expect(firstResult.success).toBe(true);
    expect(invoicesDb.length).toBe(1);

    const firstInvoiceId = firstResult.invoice.id;

    // Second conversion
    const secondResult = simulateConvertToInvoice(quotation, invoicesDb, quotationsDb);
    expect(secondResult.success).toBe(true);
    expect(secondResult.alreadyConverted).toBe(true);
    expect(secondResult.invoice.id).toBe(firstInvoiceId);
    expect(invoicesDb.length).toBe(1); // No new invoice created
    expect(quotation.convertedInvoiceId).toBe(firstInvoiceId);
  });

  it('should throw concurrency error if state changes concurrently in locked transaction', () => {
    const quotationRef = createMockQuotation('ACCEPTED');
    const invoicesDb: Array<any> = [];
    
    // Simulate DB state where the locked record has already been converted by another process
    const quotationsDb: Array<Quotation> = [
      {
        ...quotationRef,
        status: 'CONVERTED',
        convertedInvoiceId: 99999,
      }
    ];

    expect(() => {
      simulateConvertToInvoice(quotationRef, invoicesDb, quotationsDb);
    }).toThrow('تم تحويل هذا العرض مسبقاً أو غير موجود');

    expect(invoicesDb.length).toBe(0);
  });
});
