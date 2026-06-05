import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalEngine } from '../src/lib/approval-engine';

describe('ApprovalEngine - Unit Tests', () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      approvalRequest: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      approvalRule: {
        findMany: vi.fn(),
      },
      approvalStep: {
        update: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };
  });

  it('should initialize successfully with a custom PrismaClient instance', () => {
    const engine = new ApprovalEngine(mockPrisma);
    expect(engine['prisma']).toBe(mockPrisma);
  });

  it('should auto-approve if no rules match the document amount', async () => {
    mockPrisma.approvalRequest.findFirst.mockResolvedValue(null);
    mockPrisma.approvalRule.findMany.mockResolvedValue([]); // No rules

    const engine = new ApprovalEngine(mockPrisma);
    const result = await engine.submit({
      tenantId: 'tenant-1',
      documentType: 'PURCHASE_ORDER',
      documentId: 1001,
      amount: 500,
      requestedBy: 1,
    });

    expect(result.status).toBe('auto_approved');
    expect(result.requestId).toBeNull();
    expect(mockPrisma.approvalRequest.create).not.toHaveBeenCalled();
  });

  it('should create approval request and pending steps if matching rules exist', async () => {
    mockPrisma.approvalRequest.findFirst.mockResolvedValue(null);
    mockPrisma.approvalRule.findMany.mockResolvedValue([
      { id: 1, level: 1, approverId: 2, minAmount: 1000, isActive: true },
      { id: 2, level: 2, approverId: 3, minAmount: 1000, isActive: true },
    ]);
    mockPrisma.approvalRequest.create.mockResolvedValue({ id: 500 });

    const engine = new ApprovalEngine(mockPrisma);
    const result = await engine.submit({
      tenantId: 'tenant-1',
      documentType: 'PURCHASE_ORDER',
      documentId: 1001,
      amount: 1500,
      requestedBy: 1,
    });

    expect(result.status).toBe('pending_approval');
    expect(result.requestId).toBe(500);
    expect(mockPrisma.approvalRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        documentType: 'PURCHASE_ORDER',
        documentId: 1001,
        status: 'pending',
        requestedBy: 1,
        steps: {
          create: [
            { tenantId: 'tenant-1', level: 1, approverId: 2, status: 'pending', notes: null },
            { tenantId: 'tenant-1', level: 2, approverId: 3, status: 'pending', notes: null },
          ],
        },
      }),
    });
  });
});
