import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue';

export const dailyAuditWorker = new Worker(
  'aiAuditQueue',
  async (job: Job) => {
    const { tenantId, date } = job.data;
    console.log(`[DailyAuditWorker] Processing audit for tenant ${tenantId} on ${date}`);
    return { status: 'completed', report: 'Audit completed' };
  },
  { connection: redisConnection, concurrency: 2 }
);
