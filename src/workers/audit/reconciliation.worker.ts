import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue';
import { runSystemReconciliation } from '@/lib/system-audit';
import { prisma, withTenant } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit-trail';
import { logger } from '@/lib/logger';

export const systemReconciliationWorker = new Worker(
    'systemReconciliationQueue',
    async (job: Job) => {
        logger.info({}, `[SystemReconciliationWorker] Processing job ${job.id}`);
        
        // Fetch all tenants from the master DB
        const tenants = await withTenant('n11', async () => {
            try {
                return await prisma.tenantAccount.findMany({
                    select: { subdomain: true, status: true }
                });
            } catch (error) {
                logger.error({}, '[SystemReconciliationWorker] Failed to fetch tenants', { error });
                return [{ subdomain: 'n11', status: 'active' }]; // fallback
            }
        });

        const activeTenants = tenants.filter((t: any) => t.status === 'active').map((t: any) => t.subdomain);
        logger.info({}, `[SystemReconciliationWorker] Found ${activeTenants.length} active tenants`);

        const globalSummary = { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0 };
        const globalFindingsCount: { tenantId: string, count: number }[] = [];

        for (const tenantId of activeTenants) {
            try {
                await withTenant(tenantId, async () => {
                    const { summary, findings } = await runSystemReconciliation(prisma);
                    
                    globalSummary.totalFindings += summary.totalFindings;
                    globalSummary.critical += summary.critical;
                    globalSummary.high += summary.high;
                    globalSummary.medium += summary.medium;
                    globalSummary.low += summary.low;

                    if (summary.totalFindings > 0) {
                        globalFindingsCount.push({ tenantId, count: findings.length });
                        
                        await logAuditEvent(prisma as any, {
                            tenantId,
                            userId: null,
                            action: 'SYSTEM_RECONCILIATION',
                            entityType: 'System',
                            entityId: 'system-reconciliation',
                            route: 'bullmq-worker',
                            newData: { summary, findingsCount: findings.length },
                            metadata: { source: 'bullmq-worker' },
                            ipAddress: '127.0.0.1'
                        });
                    }
                });
            } catch (error: any) {
                logger.error({ tenantId }, `[SystemReconciliationWorker] Failed for tenant: ${error.message}`);
            }
        }

        logger.info({}, `[SystemReconciliationWorker] Completed. Total Findings across all tenants: ${globalSummary.totalFindings}`);
        return { status: 'completed', summary: globalSummary, activeTenantsScanned: activeTenants.length, findingsByTenant: globalFindingsCount };
    },
    { connection: redisConnection, concurrency: 1 }
);
