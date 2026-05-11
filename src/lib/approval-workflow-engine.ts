import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'approval-workflow-engine' });

export class ApprovalWorkflowEngine {
  static async requestApproval(tenantId: string, documentId: number, documentType: string, requestedByUserId: number): Promise<any> {
    log.info(`Requesting approval for ${documentType} ${documentId}`);
    
    // Find matching workflow
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: { tenantId, docType: documentType, isActive: true }
    });

    if (!workflow) return { status: 'AUTO_APPROVED' };

    return prisma.approvalRequest.create({
      data: {
        tenantId,
        documentId,
        documentType,
        status: 'pending',
        requestedBy: requestedByUserId
      }
    });
  }
}
