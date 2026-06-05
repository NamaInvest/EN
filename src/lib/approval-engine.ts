/**
 * Approval Workflow Runtime — v2 (P2.3)
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Multi-level approval engine backed by real DB models:
 *   ApprovalRule â†’ defines who approves what amount
 *   ApprovalRequest â†’ one request per document
 *   ApprovalStep â†’ one row per approver per level
 *   ApprovalWorkflow â†’ optional named workflow template
 *
 * Flow:
 *   1. submit()   â†’ create ApprovalRequest + ApprovalStep rows
 *   2. approve()  â†’ mark step approved, check if all levels done
 *   3. reject()   â†’ reject entire request
 *   4. getStatus() â†’ current state with approver details
 */

import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/api-handler';
import { Decimal } from '@prisma/client/runtime/library';

const log = logger.child({ service: 'ApprovalEngine' });

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SubmitOptions {
  tenantId: string;
  documentType: string;   // 'PURCHASE_ORDER' | 'SALES_INVOICE' | 'PAYMENT' | 'LEAVE_REQUEST'
  documentId: number;
  amount: number;
  requestedBy: number;    // userId
  notes?: string;
}

export interface ApproveOptions {
  tenantId: string;
  requestId: number;
  approverId: number;
  notes?: string;
}

export interface RejectOptions {
  tenantId: string;
  requestId: number;
  rejectorId: number;
  reason: string;
}

export interface ApprovalStatus {
  requestId: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  documentType: string;
  documentId: number;
  pendingLevel: number | null;
  totalLevels: number;
  steps: {
    id: number;
    level: number;
    status: string;
    approverId: number | null;
    approverName?: string | null;
    actionDate: Date | null;
    notes: string | null;
  }[];
}

// â”€â”€ Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class ApprovalEngine {
  private prisma: ReturnType<typeof getPrisma>;

  constructor(reqOrPrisma?: Request | ReturnType<typeof getPrisma>) {
    if (reqOrPrisma && typeof (reqOrPrisma as any).$transaction === 'function') {
      this.prisma = reqOrPrisma as ReturnType<typeof getPrisma>;
    } else {
      this.prisma = getPrisma(reqOrPrisma as Request) as ReturnType<typeof getPrisma>;
    }
  }

  // â”€â”€ 1. Submit for approval â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async submit(opts: SubmitOptions): Promise<{
    requestId: number | null;
    status: 'pending_approval' | 'auto_approved';
    levelsRequired: number;
  }> {
    const { tenantId, documentType, documentId, amount, requestedBy, notes } = opts;

    // Check if already has a pending request
    const existing = await (this.prisma as any).approvalRequest.findFirst({
      where: { tenantId, documentType, documentId, status: 'pending' },
    });
    if (existing) {
      log.warn(`Document ${documentType}#${documentId} already has a pending approval`);
      return { requestId: existing.id, status: 'pending_approval', levelsRequired: 0 };
    }

    // Load applicable rules sorted by level
    const rules = await (this.prisma as any).approvalRule.findMany({
      where: {
        tenantId,
        documentType,
        isActive: true,
        minAmount: { lte: amount },
        OR: [
          { maxAmount: null },
          { maxAmount: { gte: amount } },
        ],
      },
      orderBy: { level: 'asc' },
    });

    // Auto-approve if no rules match
    if (rules.length === 0) {
      log.info(`Auto-approved ${documentType}#${documentId} (no rules for amount ${amount})`);
      return { requestId: null, status: 'auto_approved', levelsRequired: 0 };
    }

    // Create the request
    const request = await (this.prisma as any).approvalRequest.create({
      data: {
        tenantId,
        documentType,
        documentId,
        status: 'pending',
        requestedBy,
        steps: {
          create: rules.map((rule: any) => ({
            tenantId,
            level: rule.level,
            approverId: rule.approverId ?? null,
            status: 'pending',
            notes: rule.approverId ? null : `Role required: ${rule.approverRole}`,
          })),
        },
      },
    });

    log.info(`Approval request #${request.id} created for ${documentType}#${documentId} — ${rules.length} level(s)`);

    return { requestId: request.id, status: 'pending_approval', levelsRequired: rules.length };
  }

  // â”€â”€ 2. Approve (by approver) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async approve(opts: ApproveOptions): Promise<{
    fullyApproved: boolean;
    nextLevel: number | null;
    requestId: number;
  }> {
    const { tenantId, requestId, approverId, notes } = opts;

    const request = await (this.prisma as any).approvalRequest.findFirst({
      where: { id: requestId, tenantId, status: 'pending' },
      include: { steps: { orderBy: { level: 'asc' } } },
    });

    if (!request) throw new AppError(`Approval request #${requestId} not found or already resolved`, 404);

    // Find the current pending level
    const pendingStep = request.steps.find((s: any) => s.status === 'pending');
    if (!pendingStep) throw new AppError('No pending step found', 400);

    // Verify the approver is allowed for this step
    if (pendingStep.approverId && pendingStep.approverId !== approverId) {
      throw new AppError(`User ${approverId} is not the designated approver for this step`, 403);
    }

    // Mark this step as approved
    await (this.prisma as any).approvalStep.update({
      where: { id: pendingStep.id },
      data: {
        status: 'approved',
        approverId,
        actionDate: new Date(),
        notes: notes ?? null,
      },
    });

    // Check if all steps are now approved
    const remainingSteps = request.steps.filter(
      (s: any) => s.id !== pendingStep.id && s.status === 'pending'
    );

    if (remainingSteps.length === 0) {
      // Fully approved — update request status
      await (this.prisma as any).approvalRequest.update({
        where: { id: requestId },
        data: { status: 'approved' },
      });

      log.info(`Request #${requestId} fully approved by user ${approverId}`);
      return { fullyApproved: true, nextLevel: null, requestId };
    }

    const nextLevel = remainingSteps[0].level;
    log.info(`Request #${requestId} step approved, waiting for level ${nextLevel}`);
    return { fullyApproved: false, nextLevel, requestId };
  }

  // â”€â”€ 3. Reject â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async reject(opts: RejectOptions): Promise<void> {
    const { tenantId, requestId, rejectorId, reason } = opts;

    const request = await (this.prisma as any).approvalRequest.findFirst({
      where: { id: requestId, tenantId, status: 'pending' },
    });

    if (!request) throw new AppError(`Approval request #${requestId} not found`, 404);

    await (this.prisma as any).approvalRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    // Mark all pending steps as rejected
    await (this.prisma as any).approvalStep.updateMany({
      where: { requestId, status: 'pending' },
      data: {
        status: 'rejected',
        approverId: rejectorId,
        actionDate: new Date(),
        notes: reason,
      },
    });

    log.info(`Request #${requestId} rejected by user ${rejectorId}: ${reason}`);
  }

  // â”€â”€ 4. Get Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getStatus(tenantId: string, documentType: string, documentId: number): Promise<ApprovalStatus | null> {
    const request = await (this.prisma as any).approvalRequest.findFirst({
      where: { tenantId, documentType, documentId },
      orderBy: { requestedAt: 'desc' },
      include: {
        steps: {
          orderBy: { level: 'asc' },
          include: { approver: { select: { id: true, name: true } } },
        },
      },
    });

    if (!request) return null;

    const pendingStep = request.steps.find((s: any) => s.status === 'pending');

    return {
      requestId: request.id,
      status: request.status as ApprovalStatus['status'],
      documentType: request.documentType,
      documentId: request.documentId,
      pendingLevel: pendingStep?.level ?? null,
      totalLevels: request.steps.length,
      steps: request.steps.map((s: any) => ({
        id: s.id,
        level: s.level,
        status: s.status,
        approverId: s.approverId,
        approverName: s.approver?.name ?? null,
        actionDate: s.actionDate,
        notes: s.notes,
      })),
    };
  }

  // â”€â”€ 5. Get Pending for User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getPendingForUser(tenantId: string, userId: number, userRole?: string) {
    const where: any = {
      tenantId,
      status: 'pending',
      request: { status: 'pending' },
    };

    // Steps specifically assigned to this user
    where.OR = [
      { approverId: userId },
    ];

    // Also get role-based steps if role provided
    if (userRole) {
      where.OR.push({
        approverId: null, // Role-based (no specific user)
      });
    }

    const steps = await (this.prisma as any).approvalStep.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            documentType: true,
            documentId: true,
            requestedAt: true,
            requester: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { request: { requestedAt: 'asc' } },
      take: 50,
    });

    return steps;
  }
}

