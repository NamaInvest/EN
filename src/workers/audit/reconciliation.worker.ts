import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue';
import { runSystemReconciliation } from '@/lib/system-audit';
import { PrismaClient } from '@prisma/client';
import { logAuditEvent } from '@/lib/audit-trail';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export const systemReconciliationWorker = new Worker(
    'systemReconciliationQueue',
    async (job: Job) => {
        logger.info({}, `[SystemReconciliationWorker] Processing job ${job.id}`);
        
        const { summary, findings } = await runSystemReconciliation(prisma);
        
        await logAuditEvent(prisma as any, {
            tenantId: 'system',
            userId: null,
            action: 'SYSTEM_RECONCILIATION',
            entityType: 'System',
            entityId: 'system-reconciliation',
            route: 'bullmq-worker',
            newData: { summary, findingsCount: findings.length },
            metadata: { source: 'bullmq-worker' },
            ipAddress: '127.0.0.1'
        });

        logger.info({}, `[SystemReconciliationWorker] Completed. Findings: ${summary.totalFindings}`);
        return { status: 'completed', summary, findingsCount: findings.length };
    },
    { connection: redisConnection, concurrency: 1 }
);
