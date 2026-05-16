/**
 * Expense Report Engine
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

import { runFinancialTx } from '@/lib/db/transaction';
import { Prisma } from '@prisma/client';

const log = logger.child({ service: 'expense-report-engine' });

export class ExpenseReportEngine {
    static async list(prisma: any, tenantId: string) {
        return prisma.expenseReport.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, include: { lines: true }, take: 50 }) || [];
    }
    static async getById(prisma: any, id: number, tenantId: string) {
        return prisma.expenseReport.findUnique({ where: { id, tenantId }, include: { lines: true } }) || null;
    }
    static async create(prisma: any, data: { employeeId: number; title: string; tenantId: string; lines: any[] }) {
        const totalAmount = data.lines.reduce((s: number, l: any) => s + (parseFloat(l.amount) || 0), 0);
        
        let reportId = Date.now();
        await runFinancialTx(prisma, async (tx: any) => {
            const report = await tx.expenseReport.create({ 
                data: { employeeId: data.employeeId, title: data.title, totalAmount, status: 'DRAFT', tenantId: data.tenantId } 
            });
            reportId = report.id;
            
            if (report && data.lines?.length) {
                const linesToCreate = data.lines.map((line: any) => ({
                    reportId: report.id,
                    tenantId: data.tenantId,
                    date: new Date(line.date || Date.now()),
                    category: line.category || 'OTHER',
                    description: line.description,
                    amount: parseFloat(line.amount) || 0,
                    receiptUrl: line.receiptUrl,
                    vendor: line.vendor
                }));
                await tx.expenseLine.createMany({ data: linesToCreate });
            }
        }, 'EXPENSE_REPORT_CREATE');
        
        return { id: reportId, ...data, totalAmount, status: 'DRAFT' };
    }
    static async submit(prisma: any, id: number, tenantId: string) {
        return prisma.expenseReport.update({ where: { id, tenantId }, data: { status: 'SUBMITTED' } }) || {};
    }
    static async approve(prisma: any, id: number, approvedBy: number, tenantId: string) {
        return prisma.expenseReport.update({ where: { id, tenantId }, data: { status: 'APPROVED', approvedBy } }) || {};
    }
    static async reject(prisma: any, id: number, tenantId: string) {
        return prisma.expenseReport.update({ where: { id, tenantId }, data: { status: 'REJECTED' } }) || {};
    }
}
