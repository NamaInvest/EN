import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'mudad-sync-engine' });

export class MudadSyncEngine {
  static async logSync(tenantId: string, payrollRunId: number, success: boolean, details?: any): Promise<any> {
    log.info(`Logging Mudad sync for payroll ${payrollRunId}`);
    return prisma.mudadSyncLog.create({
      data: {
        tenantId,
        payrollRunId,
        status: success ? 'SUCCESS' : 'FAILED',
        errorDetails: details || null
      }
    });
  }
}
