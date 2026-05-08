import { prisma } from '@/lib/prisma';
import { StateMachine } from '../engine/state-machine';
import { BusinessContext } from '@/services/shared/event-bus.service';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized to approve this step.');
    this.name = 'UnauthorizedError';
  }
}

export class InvalidStateError extends Error {
  constructor() {
    super('Approval step is not in a PENDING state.');
    this.name = 'InvalidStateError';
  }
}

export class ApprovalRuntime {
  /**
   * Submit a new approval request for a document.
   * This generates the required approval steps.
   */
  async submit(
    documentType: string,
    documentId: number,
    requesterId: number,
    tenantId: string,
    approvers: { userId: number; level: number }[]
  ): Promise<number> {
    const request = await prisma.approvalRequest.create({
      data: {
        documentType,
        documentId,
        requestedBy: requesterId,
        tenantId,
        status: 'pending',
      },
    });

    for (const approver of approvers) {
      await prisma.approvalStep.create({
        data: {
          requestId: request.id,
          approverId: approver.userId,
          level: approver.level,
          status: 'pending',
          tenantId,
        },
      });
    }

    // Example: Notify approvers via Queue/Email could happen here

    return request.id;
  }

  /**
   * Approve a specific step.
   */
  async approve(stepId: number, userId: number, notes?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const step = await tx.approvalStep.findUnique({
        where: { id: stepId },
        include: { request: true },
      });

      if (!step) throw new Error('Approval step not found.');
      if (step.approverId !== userId) throw new UnauthorizedError();
      if (step.status !== 'pending') throw new InvalidStateError();

      // Mark step as approved
      await tx.approvalStep.update({
        where: { id: stepId },
        data: {
          status: 'approved',
          notes,
          actionDate: new Date(),
        },
      });

      // Check if there are any pending steps left for this request
      const pendingCount = await tx.approvalStep.count({
        where: {
          requestId: step.requestId,
          status: 'pending',
        },
      });

      if (pendingCount === 0) {
        // All steps approved -> Approve the main request
        await tx.approvalRequest.update({
          where: { id: step.requestId },
          data: { status: 'approved' },
        });

        // Use the StateMachine to move the underlying document to 'Approved'
        // Construct a BusinessContext
        const ctx: BusinessContext = {
          user: { id: String(userId) },
          tenant: { id: step.tenantId },
          requirePermission: () => {}
        };

        const stateMachine = new StateMachine(step.request.documentType, tx as any);
        
        try {
          await stateMachine.transition(
            String(step.request.documentId),
            'pending_approval',
            'approved',
            'approve',
            ctx
          );
        } catch (error) {
          // You might log this error or rethrow
          console.error(`StateMachine transition failed for ${step.request.documentType} ID ${step.request.documentId}:`, error);
          throw error;
        }
      }
    });
  }

  /**
   * Reject a specific step.
   */
  async reject(stepId: number, userId: number, notes?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const step = await tx.approvalStep.findUnique({
        where: { id: stepId },
        include: { request: true },
      });

      if (!step) throw new Error('Approval step not found.');
      if (step.approverId !== userId) throw new UnauthorizedError();
      if (step.status !== 'pending') throw new InvalidStateError();

      // Mark step as rejected
      await tx.approvalStep.update({
        where: { id: stepId },
        data: {
          status: 'rejected',
          notes,
          actionDate: new Date(),
        },
      });

      // Reject the main request immediately
      await tx.approvalRequest.update({
        where: { id: step.requestId },
        data: { status: 'rejected' },
      });

      // Move underlying document state to rejected
      const ctx: BusinessContext = {
        user: { id: String(userId) },
        tenant: { id: step.tenantId },
        requirePermission: () => {}
      };

      const stateMachine = new StateMachine(step.request.documentType, tx as any);
      
      try {
        await stateMachine.transition(
          String(step.request.documentId),
          'pending_approval',
          'rejected',
          'reject',
          ctx
        );
      } catch (error) {
        console.error(`StateMachine transition failed for ${step.request.documentType} ID ${step.request.documentId}:`, error);
        throw error;
      }
    });
  }
}
