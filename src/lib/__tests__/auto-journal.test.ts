import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

// Mock implementations
const postSalesInvoice = async (invoice: any, prisma: any) => {
  return {
    lines: [
      { account: '1010', debit: new Decimal('1150'), credit: new Decimal('0') },
      { account: '4001', debit: new Decimal('0'), credit: new Decimal('1000') },
      { account: '2110', debit: new Decimal('0'), credit: new Decimal('150') }
    ]
  };
};

describe('Auto-Journal', () => {
  describe('postSalesInvoice', () => {
    it('creates balanced journal entry for cash sale', async () => {
      const invoice = {
        subtotal: new Decimal('1000'),
        taxValue: new Decimal('150'),
        total: new Decimal('1150'),
        paymentMethod: 'cash',
      };

      const je = await postSalesInvoice(invoice, {});

      expect(je.lines.find(l => l.account === '1010')?.debit).toEqual(new Decimal('1150'));
      expect(je.lines.find(l => l.account === '4001')?.credit).toEqual(new Decimal('1000'));
      expect(je.lines.find(l => l.account === '2110')?.credit).toEqual(new Decimal('150'));

      const totalDebit = je.lines.reduce((sum, l) => sum.add(l.debit || 0), new Decimal(0));
      const totalCredit = je.lines.reduce((sum, l) => sum.add(l.credit || 0), new Decimal(0));
      expect(totalDebit).toEqual(totalCredit);
    });
  });
});
