/**
 * Approval Workflow Runtime
 * Full implementation using ApprovalWorkflow + ApprovalWorkflowStep + ApprovalRequest + ApprovalStep models
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.workflow.app' });

export interface SubmitApprovalInput {
  tenantId: string;
  documentType: string;
  documentId: number;
  requestedBy: number;
  amount?: number;    // for condition matching
  currency?: string;
}

export interface ApprovalDecision {
  tenantId: string;
  stepId: number;
  approverId: number;
  decision: 'approved' | 'rejected';
  notes?: string;
}

export class ApprovalRuntime {
  constructor(private prisma: PrismaClient) {}

  /**
   * Submit a document for approval — finds matching workflow and creates steps
   */
  async submit(input: SubmitApprovalInput): Promise<{ requestId: number; steps: number }> {
    const { tenantId, documentType, documentId, requestedBy, amount } = input;

    // Find active workflow for this document type
    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: { tenantId, docType: documentType, isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    // Match workflow by conditions (e.g. minAmount)
    let workflow = workflows[0];
    for (const wf of workflows) {
      if (!wf.conditions) continue;
      const conds = wf.conditions as Record<string, unknown>;
      if (amount !== undefined && conds.minAmount && amount < Number(conds.minAmount)) continue;
      workflow = wf;
      break;
    }

    if (!workflow || workflow.steps.length === 0) {
      // No approval required — auto-approve
      return { requestId: -1, steps: 0 };
    }

    // Create ApprovalRequest
    const request = await this.prisma.approvalRequest.create({
      data: {
        tenantId,
        documentType,
        documentId,
        requestedBy,
        status: 'pending',
      },
    });

    // Create ApprovalStep for each workflow step
    const now = new Date();
    let stepsCreated = 0;
    for (const step of workflow.steps) {
      // Determine approver ID
      let approverId: number | null = null;
      if (step.approverType === 'USER' && step.approverId) {
        approverId = step.approverId;
      } else if (step.approverType === 'MANAGER') {
        // Find manager: get employee with a managerId set in this tenant
        const emp = await this.prisma.employee.findFirst({
          where: { tenantId, active: true, managerId: { not: null } },
          select: { managerId: true },
        });
        approverId = emp?.managerId ?? null;
      }

      await this.prisma.approvalStep.create({
        data: {
          tenantId,
          requestId: request.id,
          approverId,
          level: step.stepOrder,
          status: 'pending', // All steps start pending; API caller filters by level
        },
      });
      stepsCreated++;
    }

    // Notify first approver
    if (stepsCreated > 0) {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: 'APPROVAL_SUBMITTED',
          tableName: documentType.toLowerCase(),
          recordId: String(documentId),
          userId: requestedBy,
          details: JSON.stringify({ requestId: request.id, workflowCode: workflow.code, steps: stepsCreated }),
        },
      });
    }

    return { requestId: request.id, steps: stepsCreated };
  }

  /**
   * Approve or reject a step
   */
  async decide(input: ApprovalDecision): Promise<{ finalDecision: string | null; requestStatus: string }> {
    const { tenantId, stepId, approverId, decision, notes } = input;

    const step = await this.prisma.approvalStep.findFirstOrThrow({
      where: { id: stepId, tenantId, status: 'pending' },
      include: { request: { include: { steps: { orderBy: { level: 'asc' } } } } },
    });

    if (step.approverId !== null && step.approverId !== approverId) {
      throw new Error('[ApprovalRuntime] Unauthorized approver for this step');
    }

    // Update this step
    await this.prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: decision,
        actionDate: new Date(),
        notes,
      },
    });

    // Log action
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: `APPROVAL_${decision.toUpperCase()}`,
        tableName: step.request.documentType.toLowerCase(),
        recordId: String(step.request.documentId),
        userId: approverId ?? undefined,
        details: JSON.stringify({ stepId, requestId: step.requestId, decision, notes }),
      },
    });

    // If rejected → close request
    if (decision === 'rejected') {
      await this.prisma.approvalRequest.update({
        where: { id: step.requestId },
        data: { status: 'rejected' },
      });
      return { finalDecision: 'rejected', requestStatus: 'rejected' };
    }

    // Approved → check if next step exists
    const allSteps = step.request.steps;
    const currentLevel = step.level;
    const nextStep = allSteps.find((s) => s.level === currentLevel + 1);

    if (nextStep) {
      // Activate next step
      await this.prisma.approvalStep.update({
        where: { id: nextStep.id },
        data: { status: 'pending' },
      });
      return { finalDecision: null, requestStatus: 'pending' };
    } else {
      // All steps approved
      await this.prisma.approvalRequest.update({
        where: { id: step.requestId },
        data: { status: 'approved' },
      });
      return { finalDecision: 'approved', requestStatus: 'approved' };
    }
  }

  /**
   * Escalate overdue approval steps (called from cron)
   */
  async escalateOverdue(tenantId: string, escalateAfterHours: number = 48): Promise<number> {
    const cutoff = new Date(Date.now() - escalateAfterHours * 60 * 60 * 1000);

    const overdueSteps = await this.prisma.approvalStep.findMany({
      where: {
        tenantId,
        status: 'pending',
        request: { requestedAt: { lte: cutoff } },
      },
      include: { request: true },
    });

    let escalated = 0;
    for (const step of overdueSteps) {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: 'APPROVAL_ESCALATED',
          tableName: step.request.documentType.toLowerCase(),
          recordId: String(step.request.documentId),
          details: JSON.stringify({ stepId: step.id, requestId: step.requestId, escalatedAt: new Date() }),
        },
      });
      escalated++;
    }

    return escalated;
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingForUser(tenantId: string, userId: number): Promise<{
    stepId: number;
    requestId: number;
    documentType: string;
    documentId: number;
    requestedAt: Date;
    level: number;
  }[]> {
    const steps = await this.prisma.approvalStep.findMany({
      where: { tenantId, approverId: userId, status: 'pending' },
      include: { request: { select: { documentType: true, documentId: true, requestedAt: true } } },
      orderBy: { request: { requestedAt: 'asc' } },
    });

    return steps.map((s) => ({
      stepId: s.id,
      requestId: s.requestId,
      documentType: s.request.documentType,
      documentId: s.request.documentId,
      requestedAt: s.request.requestedAt,
      level: s.level,
    }));
  }
}

