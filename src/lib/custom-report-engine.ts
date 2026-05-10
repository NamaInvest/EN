// @ts-nocheck
import { PrismaClient, CustomReport } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'CustomReport' });

const prisma = new PrismaClient();

export interface ReportConfig {
    dataset: string; // 'sales', 'purchases', 'inventory', 'journal_entries'
    dimensions: string[]; // e.g., ['customerId', 'date']
    measures: { field: string, aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' }[];
    filters: { field: string, operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte', value: any }[];
    sortBy: { field: string, direction: 'asc' | 'desc' }[];
    limit?: number;
}

export class CustomReportEngine {
    
    /**
     * Executes a user-defined custom report based on its JSON config
     */
    static async executeReport(reportId: number): Promise<any> {
        const report = await prisma.customReport.findUnique({
            where: { id: reportId }
        });

        if (!report) throw new Error("Report not found");
        
        const config = report.config as unknown as ReportConfig;
        return this.runDynamicQuery(config);
    }

    /**
     * Preview a report before saving it
     */
    static async previewReport(config: ReportConfig): Promise<any> {
        return this.runDynamicQuery(config);
    }

    /**
     * Dynamically builds and executes a Prisma query based on the config.
     * Uses Prisma's groupBy for aggregation.
     */
    private static async runDynamicQuery(config: ReportConfig): Promise<any[]> {
        // Map abstract datasets to Prisma model names
        const modelMap: Record<string, any> = {
            'sales': prisma.salesInvoice,
            'purchases': prisma.purchaseInvoice,
            'inventory': prisma.stockMovement,
            'journal_entries': prisma.journalLine
        };

        const model = modelMap[config.dataset];
        if (!model) throw new Error(`Dataset ${config.dataset} is not supported.`);

        // Build Prisma where clause
        const where: any = {};
        for (const filter of config.filters || []) {
            if (filter.operator === 'equals') where[filter.field] = filter.value;
            else if (filter.operator === 'contains') where[filter.field] = { contains: filter.value, mode: 'insensitive' };
            else if (filter.operator === 'gt') where[filter.field] = { gt: filter.value };
            else if (filter.operator === 'lt') where[filter.field] = { lt: filter.value };
            else if (filter.operator === 'gte') where[filter.field] = { gte: filter.value };
            else if (filter.operator === 'lte') where[filter.field] = { lte: filter.value };
        }

        // Build Prisma _sum, _count, etc.
        const _sum: any = {};
        const _count: any = {};
        const _avg: any = {};
        const _min: any = {};
        const _max: any = {};

        for (const measure of config.measures || []) {
            if (measure.aggregation === 'sum') _sum[measure.field] = true;
            if (measure.aggregation === 'count') _count[measure.field] = true;
            if (measure.aggregation === 'avg') _avg[measure.field] = true;
            if (measure.aggregation === 'min') _min[measure.field] = true;
            if (measure.aggregation === 'max') _max[measure.field] = true;
        }

        // Build Prisma orderBy
        const orderBy: any = {};
        for (const sort of config.sortBy || []) {
            // Note: In Prisma groupBy, sorting by aggregated fields requires specific syntax in newer versions, 
            // but for simplicity we assume sorting by dimension fields here.
            orderBy[sort.field] = sort.direction;
        }

        const queryArgs: any = {
            by: config.dimensions,
            where: Object.keys(where).length > 0 ? where : undefined,
            orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
            take: config.limit || 1000
        };

        if (Object.keys(_sum).length > 0) queryArgs._sum = _sum;
        if (Object.keys(_count).length > 0) queryArgs._count = _count;
        if (Object.keys(_avg).length > 0) queryArgs._avg = _avg;
        if (Object.keys(_min).length > 0) queryArgs._min = _min;
        if (Object.keys(_max).length > 0) queryArgs._max = _max;

        try {
            const results = await model.groupBy(queryArgs);
            
            // Flatten the results for easier frontend consumption
            return results.map((row: any) => {
                const flattened: any = { ...row };
                if (row._sum) { Object.keys(row._sum).forEach(k => flattened[`sum_${k}`] = row._sum[k]); delete flattened._sum; }
                if (row._count) { Object.keys(row._count).forEach(k => flattened[`count_${k}`] = row._count[k]); delete flattened._count; }
                if (row._avg) { Object.keys(row._avg).forEach(k => flattened[`avg_${k}`] = row._avg[k]); delete flattened._avg; }
                return flattened;
            });
        } catch (error: any) {
            log.error("Custom Report Engine Error:", error);
            throw new Error(`Failed to execute report: ${error.message}`);
        }
    }

    /**
     * Executes scheduled reports and dispatches emails (Called via Cron)
     */
    static async processScheduledReports(): Promise<number> {
        const now = new Date();
        const dueSchedules = await prisma.reportSchedule.findMany({
            take: 100,
            where: {
                status: 'ACTIVE',
                OR: [
                    { nextRunAt: { lte: now } },
                    { nextRunAt: null }
                ]
            },
            include: { report: true }
        });

        let processed = 0;

        for (const schedule of dueSchedules) {
            try {
                // 1. Run the report
                const data = await this.executeReport(schedule.reportId);
                
                // 2. Generate Format (Excel/PDF)
                // (Implementation of XLSX or PDFKit generation would go here)
                const fileBuffer = Buffer.from("Report Data Placeholder"); 
                
                // 3. Send Email
                const recipients = schedule.emailRecipients.split(',').map(e => e.trim());
                // await EmailService.sendReport(recipients, schedule.report.name, fileBuffer, schedule.format);
                
                // 4. Calculate next run date
                const nextRun = new Date(now);
                if (schedule.frequency === 'DAILY') nextRun.setDate(nextRun.getDate() + 1);
                else if (schedule.frequency === 'WEEKLY') nextRun.setDate(nextRun.getDate() + 7);
                else if (schedule.frequency === 'MONTHLY') nextRun.setMonth(nextRun.getMonth() + 1);

                // 5. Update Schedule
                await prisma.reportSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        lastRunAt: now,
                        nextRunAt: nextRun
                    }
                });

                processed++;
            } catch (err: any) {
                log.error(`Failed to process schedule ${schedule.id}:`, err);
            }
        }

        return processed;
    }
}
