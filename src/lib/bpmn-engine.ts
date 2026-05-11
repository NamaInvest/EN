import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bpmn-engine' });

export class BPMNEngine {
  static async startProcess(tenantId: string, processCode: string, payload: any): Promise<any> {
    log.info(`Starting BPMN Process ${processCode} for tenant ${tenantId}`);
    const process = await prisma.bPMNProcess.findUnique({ where: { code: processCode } });
    if (!process) throw new Error('Process not found');

    return prisma.bPMNTask.create({
      data: {
        tenantId,
        processId: process.id,
        taskName: 'Start Event',
        payload,
        status: 'PENDING'
      }
    });
  }
}
