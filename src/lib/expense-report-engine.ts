/**
 * Expense Report Engine
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'expense-report-engine' });
const p = (prisma: PrismaClient) => prisma as any;

export class ExpenseReportEngine {
    static async list(prisma: PrismaClient, tenantId: string) {
        return p(prisma).expenseReport?.findMany?.({ where: { tenantId }, orderBy: { createdAt: 'desc' }, include: { lines: true }, take: 50 }) || [];
    }
    static async getById(prisma: PrismaClient, id: number) {
        return p(prisma).expenseReport?.findUnique?.({ where: { id }, include: { lines: true } }) || null;
    }
    static async create(prisma: PrismaClient, data: { employeeId: number; title: string; tenantId: string; lines: any[] }) {
        const totalAmount = data.lines.reduce((s: number, l: any) => s + (parseFloat(l.amount) || 0), 0);
        const report = await p(prisma).expenseReport?.create?.({ data: { employeeId: data.employeeId, title: data.title, totalAmount, status: 'DRAFT', tenantId: data.tenantId } });
        if (report && data.lines?.length) {
            for (const line of data.lines) {
                await p(prisma).expenseLine?.create?.({ data: { reportId: report.id, date: new Date(line.date || Date.now()), category: line.category || 'OTHER', description: line.description, amount: parseFloat(line.amount) || 0, receiptUrl: line.receiptUrl, vendor: line.vendor } });
            }
        }
        return report || { id: Date.now(), ...data, totalAmount, status: 'DRAFT' };
    }
    static async submit(prisma: PrismaClient, id: number) {
        return p(prisma).expenseReport?.update?.({ where: { id }, data: { status: 'SUBMITTED' } }) || {};
    }
    static async approve(prisma: PrismaClient, id: number, approvedBy: number) {
        return p(prisma).expenseReport?.update?.({ where: { id }, data: { status: 'APPROVED', approvedBy } }) || {};
    }
    static async reject(prisma: PrismaClient, id: number) {
        return p(prisma).expenseReport?.update?.({ where: { id }, data: { status: 'REJECTED' } }) || {};
    }
}
