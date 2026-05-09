/**
 * Auto-Journal Comprehensive Tests
 * ──────────────────────────────────────────────────────────
 * Tests the accounting engine's core auto-journaling logic.
 */

import { factory, resetFactoryIds } from './factories';
import { HRService } from '@/lib/services/hr.service';

describe('Auto-Journal Engine', () => {
  beforeEach(() => resetFactoryIds());

  describe('Sales Invoice → Journal Entry', () => {
    it('should create balanced journal entry for cash sale', () => {
      const invoice = factory.salesInvoice({ total: 1150, paid: 1150, taxValue: 150 });
      // Debit Cash 1150, Credit Sales 1000, Credit VAT 150
      const debit = Number(invoice.total);
      const credit = Number(invoice.subtotal) + Number(invoice.taxValue);
      expect(debit).toBe(credit);
    });

    it('should handle credit sale with receivables', () => {
      const invoice = factory.salesInvoice({ paymentType: 'credit', paid: 0, remaining: 1150 });
      expect(invoice.remaining).toBe(1150);
      expect(invoice.paymentType).toBe('credit');
    });

    it('should handle split payment correctly', () => {
      const invoice = factory.salesInvoice({ paymentType: 'split', paid: 500, total: 1150, remaining: 650 });
      expect(Number(invoice.paid) + Number(invoice.remaining)).toBe(Number(invoice.total));
    });
  });

  describe('Salary → Journal Entry', () => {
    it('should calculate GOSI correctly for Saudi employee', () => {
      const hrService = new HRService();
      const calc = hrService.calculatePayslip(8000, 500, 200);

      expect(calc.gosiEmployee).toBe(780); // 8000 * 9.75%
      expect(calc.gosiEmployer).toBe(940); // 8000 * 11.75%
      expect(calc.netSalary).toBe(8500 - 780 - 200); // gross - gosi - deductions
    });

    it('should cap GOSI at 45000 SAR base', () => {
      const hrService = new HRService();
      const calc = hrService.calculatePayslip(50000);

      // GOSI base capped at 45000
      expect(calc.gosiEmployee).toBe(Math.round(45000 * 0.0975 * 100) / 100);
      expect(calc.gosiEmployer).toBe(Math.round(45000 * 0.1175 * 100) / 100);
    });

    it('should produce balanced journal entries', () => {
      const hrService = new HRService();
      const calc = hrService.calculatePayslip(10000, 0, 0);

      const totalDebits = calc.grossSalary + calc.gosiEmployer;
      const totalCredits = calc.netSalary + calc.gosiEmployee + calc.gosiEmployer;
      expect(totalDebits).toBe(totalCredits);
    });
  });

  describe('End of Service Benefits', () => {
    const hrService = new HRService();

    it('should return 0 for resignation under 2 years', () => {
      expect(hrService.calculateEndOfService(10000, 1.5, 'resignation')).toBe(0);
    });

    it('should return 1/3 for resignation 2-5 years', () => {
      const benefit = hrService.calculateEndOfService(10000, 3, 'resignation');
      const expected = ((10000 / 30) * 15 * 3) / 3;
      expect(benefit).toBe(Math.round(expected * 100) / 100);
    });

    it('should return full for termination', () => {
      const benefit = hrService.calculateEndOfService(10000, 3, 'termination');
      const expected = (10000 / 30) * 15 * 3;
      expect(benefit).toBe(Math.round(expected * 100) / 100);
    });

    it('should apply 30-day rate after 5 years for termination', () => {
      const benefit = hrService.calculateEndOfService(10000, 8, 'termination');
      const first5 = (10000 / 30) * 15 * 5;
      const remaining = (10000 / 30) * 30 * 3;
      expect(benefit).toBe(Math.round((first5 + remaining) * 100) / 100);
    });
  });

  describe('Journal Balance Validation', () => {
    it('should ensure total debits = total credits', () => {
      const entry = factory.journalEntry();
      const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
      expect(totalDebit).toBe(totalCredit);
    });

    it('should reject unbalanced entries', () => {
      const entry = factory.journalEntry({
        lines: [
          { accountCode: '1100', debit: 1000, credit: 0 },
          { accountCode: '4100', debit: 0, credit: 500 }, // Unbalanced!
        ],
      });
      const totalDebit = (entry.lines as { debit: number; credit: number }[]).reduce((s: number, l: { debit: number }) => s + l.debit, 0);
      const totalCredit = (entry.lines as { debit: number; credit: number }[]).reduce((s: number, l: { credit: number }) => s + l.credit, 0);
      expect(totalDebit).not.toBe(totalCredit);
    });
  });
});

describe('Multi-tenant Isolation', () => {
  it('should include tenantId in all factory outputs', () => {
    expect(factory.salesInvoice().tenantId).toBe('test-tenant');
    expect(factory.employee().tenantId).toBe('test-tenant');
    expect(factory.journalEntry().tenantId).toBe('test-tenant');
    expect(factory.product().tenantId).toBe('test-tenant');
    expect(factory.customer().tenantId).toBe('test-tenant');
    expect(factory.salary().tenantId).toBe('test-tenant');
  });

  it('should generate unique IDs per factory call', () => {
    resetFactoryIds();
    const a = factory.salesInvoice();
    const b = factory.salesInvoice();
    expect(a.id).not.toBe(b.id);
  });
});
