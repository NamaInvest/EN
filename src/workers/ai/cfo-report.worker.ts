import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue';

export const cfoReportWorker = new Worker(
  'reportQueue',
  async (job: Job) => {
    const { tenantId } = job.data;
    console.log(`[CFOReportWorker] Processing CFO report for tenant ${tenantId}`);
    return { status: 'completed', report: 'CFO Report generated' };
  },
  { connection: redisConnection, concurrency: 1 }
);
