import { calculateFinancials } from './financial';

describe('Financial Logic Tests', () => {
  it('should calculate totals correctly with 15% VAT and no discount', () => {
    const result = calculateFinancials({ subtotal: 100, discount: 0, taxRate: 15 });
    expect(result.subtotalAfterDiscount).toBe(100);
    expect(result.taxAmount).toBe(15);
    expect(result.total).toBe(115);
  });

  it('should calculate totals correctly with discount and 15% VAT', () => {
    const result = calculateFinancials({ subtotal: 100, discount: 20, taxRate: 15 });
    expect(result.subtotalAfterDiscount).toBe(80);
    expect(result.taxAmount).toBe(12); // 15% of 80
    expect(result.total).toBe(92);
  });

  it('should handle zero discount correctly', () => {
    const result = calculateFinancials({ subtotal: 200, discount: 0, taxRate: 15 });
    expect(result.subtotalAfterDiscount).toBe(200);
    expect(result.taxAmount).toBe(30);
    expect(result.total).toBe(230);
  });

  it('should handle full discount (100%)', () => {
    const result = calculateFinancials({ subtotal: 100, discount: 100, taxRate: 15 });
    expect(result.subtotalAfterDiscount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should throw validation error if subtotal is negative', () => {
    expect(() => calculateFinancials({ subtotal: -50, discount: 0, taxRate: 15 }))
      .toThrow('Subtotal cannot be negative');
  });

  it('should throw validation error if discount is negative', () => {
    expect(() => calculateFinancials({ subtotal: 100, discount: -10, taxRate: 15 }))
      .toThrow('Discount cannot be negative');
  });

  it('should handle zero tax rate', () => {
    const result = calculateFinancials({ subtotal: 100, discount: 0, taxRate: 0 });
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(100);
  });
});
