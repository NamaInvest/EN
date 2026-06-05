import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPurchaseOrderSaga } from '../../../src/lib/workflow/saga/purchase-sagas';
import { ApprovalEngine } from '../../../src/lib/approval-engine';

const mockSubmit = vi.fn();
const mockReject = vi.fn();

vi.mock('../../../src/lib/approval-engine', () => {
  return {
    ApprovalEngine: class {
      submit = mockSubmit;
      reject = mockReject;
    }
  };
});

describe('PurchaseOrderSaga - Approval Integration Tests', () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      customer: {
        findFirst: vi.fn().mockResolvedValue({ id: 1, name: 'Vendor 1' }),
      },
      purchaseOrder: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 200, orderNo: 1 }),
        findUnique: vi.fn().mockResolvedValue({ id: 200, total: 1500 }),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };
  });

  it('should auto-approve PO if ApprovalEngine returns status auto_approved', async () => {
    mockSubmit.mockResolvedValue({ requestId: null, status: 'auto_approved' });

    const saga = buildPurchaseOrderSaga(mockPrisma);
    const resultCtx = await saga.execute({
      tenantId: 'tenant-1',
      userId: 10,
      data: {
        supplierId: 1,
        date: '2026-06-05',
        items: [{ productId: 201, quantity: 10, unitCost: 150 }],
        requireApproval: true,
      },
    });

    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'PURCHASE_ORDER',
      amount: 1500,
      requestedBy: 10,
    }));

    // Check that PO status is updated to 'approved'
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 200 },
      data: { status: 'approved' },
    });
  });

  it('should set PO status to pending if ApprovalEngine returns pending_approval', async () => {
    mockSubmit.mockResolvedValue({ requestId: 50, status: 'pending_approval' });

    const saga = buildPurchaseOrderSaga(mockPrisma);
    const resultCtx = await saga.execute({
      tenantId: 'tenant-1',
      userId: 10,
      data: {
        supplierId: 1,
        date: '2026-06-05',
        items: [{ productId: 201, quantity: 10, unitCost: 150 }],
        requireApproval: true,
      },
    });

    expect(mockSubmit).toHaveBeenCalled();
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 200 },
      data: { status: 'pending' },
    });
    expect(resultCtx.approvalRequestId).toBe(50);
  });
});
