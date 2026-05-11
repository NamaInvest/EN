import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'overtime-approval-engine' });

export class OvertimeApprovalEngine {
  static async approveOvertime(tenantId: string, requestId: number, approvedBy: number): Promise<any> {
    log.info(`Approving overtime request ${requestId}`);
    return prisma.overtimeRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', approvedBy }
    });
  }
}
