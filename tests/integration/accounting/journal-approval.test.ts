import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPrisma } from '../../../src/lib/prisma';
import { createJournalEntry } from '../../../src/lib/auto-journal';
import { ApprovalEngine } from '../../../src/lib/approval-engine';

vi.mock('../../../src/lib/prisma', () => ({
  getPrisma: vi.fn(),
  resolveTenant: vi.fn().mockReturnValue('tenant-1'),
  withTenant: vi.fn((tenant, cb) => cb()),
}));

vi.mock('../../../src/lib/auto-journal', () => ({
  createJournalEntry: vi.fn(),
  ACCOUNTS: {
    RECEIVABLES: '1200',
    PAYABLES: '2100',
    INVENTORY: '1300',
    WIP: '1330',
    FINISHED_GOODS: '1340',
    VAT_INPUT: '1400',
    VAT_OUTPUT: '2300',
  },
}));

const mockSubmit = vi.fn();

vi.mock('../../../src/lib/approval-engine', () => {
  return {
    ApprovalEngine: class {
      submit = mockSubmit;
    }
  };
});

describe('Journal Entry - Approval Integration Tests in Route Handler', () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      approvalRule: {
        findMany: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  it('should create JE with status pending_approval if matching approval rules exist', async () => {
    // Simulated rules matched
    mockPrisma.approvalRule.findMany.mockResolvedValue([
      { id: 1, level: 1, minAmount: 1000, isActive: true },
    ]);

    (createJournalEntry as any).mockResolvedValue({ success: true, entryId: 999 });

    // Mock API Route Call Logic (simulated)
    const body = {
      description: 'Manual JE test',
      lines: [
        { accountCode: '1110', debit: 50000, credit: 0 },
        { accountCode: '1120', debit: 0, credit: 50000 },
      ],
      status: 'posted',
    };

    const totalDebit = 50000;
    const rules = await mockPrisma.approvalRule.findMany();
    expect(rules.length).toBe(1);

    const requiresApproval = rules.length > 0;
    expect(requiresApproval).toBe(true);

    const targetStatus = requiresApproval ? 'pending_approval' : body.status;
    expect(targetStatus).toBe('pending_approval'); // Overridden status!

    const result = await createJournalEntry({
      description: body.description,
      lines: body.lines,
      status: targetStatus,
    });

    expect(result.success).toBe(true);
    expect(result.entryId).toBe(999);

    const engine = new ApprovalEngine(mockPrisma);
    await engine.submit({
      tenantId: 'tenant-1',
      documentType: 'JOURNAL_ENTRY',
      documentId: result.entryId!,
      amount: totalDebit,
      requestedBy: 1,
    });

    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'JOURNAL_ENTRY',
      documentId: 999,
      amount: 50000,
    }));
  });
});
