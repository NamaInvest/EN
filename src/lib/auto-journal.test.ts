import { postSalesInvoice, createJournalEntry } from './auto-journal';
import prisma from './prisma';

// Mock the prisma instance
jest.mock('./prisma', () => ({
  __esModule: true,
  default: {
    account: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    journalEntry: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Auto-Journal Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJournalEntry Core', () => {
    it('should reject an unbalanced journal entry', async () => {
      const result = await createJournalEntry({
        description: 'Test Unbalanced',
        lines: [
          { accountCode: '1110', debit: 100, credit: 0 },
          { accountCode: '4100', debit: 0, credit: 90 }, // Unbalanced by 10
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('القيد غير متوازن');
    });

    it('should proceed if journal entry is balanced', async () => {
      // Setup mock returns
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue({ entryNumber: 'JE000010' });
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: 99 });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 1, type: 'asset' });
      (prisma.account.update as jest.Mock).mockResolvedValue({});

      const result = await createJournalEntry({
        description: 'Test Balanced',
        lines: [
          { accountCode: '1110', debit: 100, credit: 0 },
          { accountCode: '4100', debit: 0, credit: 100 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.entryId).toBe(99);
      expect(prisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  describe('postSalesInvoice', () => {
    it('should create correct journal lines for a cash sale', async () => {
      // Mock internal calls
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue({ entryNumber: 'JE000000' });
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: 100 });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 1, type: 'asset' });
      (prisma.account.update as jest.Mock).mockResolvedValue({});

      const result = await postSalesInvoice({
        invoiceNo: 101,
        subtotal: 100,
        taxValue: 15,
        total: 115,
        paymentType: 'cash',
        discountValue: 0
      });

      expect(result.success).toBe(true);
      
      // Verify the lines sent to createJournalEntry (implicitly checked by prisma.create payload)
      const createPayload = (prisma.journalEntry.create as jest.Mock).mock.calls[0][0];
      const lines = createPayload.data.lines.create;
      
      // Debit Cash: 115
      expect(lines).toContainEqual(expect.objectContaining({ debit: 115, credit: 0 }));
      // Credit Sales: 100
      expect(lines).toContainEqual(expect.objectContaining({ debit: 0, credit: 100 }));
      // Credit VAT Output: 15
      expect(lines).toContainEqual(expect.objectContaining({ debit: 0, credit: 15 }));
    });
  });
});
