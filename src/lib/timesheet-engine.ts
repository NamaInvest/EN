/**
 * Timesheet Engine (G-10)
 * ═══════════════════════
 * Weekly timesheet grid, project/task hours, billable tracking
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.timesheet-en' });
const db = (p: any) => p as any;

export class TimesheetEngine {
    /** Log hours */
    static async logHours(prisma: PrismaClient, data: {
        employeeId: number; projectId?: number; taskId?: number;
        date: Date; hours: number; description?: string;
        billable?: boolean; tenantId: string;
    }) {
        return db(prisma).timesheetEntry?.create?.({
            data: { ...data, status: 'DRAFT', createdAt: new Date() },
        });
    }

    /** Get weekly grid for employee */
    static async getWeekly(prisma: PrismaClient, employeeId: number, weekStart: Date) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const entries = await db(prisma).timesheetEntry?.findMany?.({
            where: {
                employeeId,
                date: { gte: weekStart, lte: weekEnd },
            },
            orderBy: { date: 'asc' },
        }) || [];

        // Build grid: rows = projects, columns = days
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }

        const projects = new Map<number, { projectId: number; name: string; hours: Record<string, number> }>();
        for (const entry of entries) {
            const pid = entry.projectId || 0;
            if (!projects.has(pid)) {
                projects.set(pid, { projectId: pid, name: `Project #${pid}`, hours: {} });
            }
            const dayKey = new Date(entry.date).toISOString().split('T')[0];
            const proj = projects.get(pid)!;
            proj.hours[dayKey] = (proj.hours[dayKey] || 0) + Number(entry.hours);
        }

        return {
            days,
            rows: [...projects.values()],
            totalHours: entries.reduce((s: number, e: any) => s + Number(e.hours), 0),
            billableHours: entries.filter((e: any) => e.billable).reduce((s: number, e: any) => s + Number(e.hours), 0),
        };
    }

    /** Submit timesheet for approval */
    static async submit(prisma: PrismaClient, employeeId: number, weekStart: Date) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return db(prisma).timesheetEntry?.updateMany?.({
            where: { employeeId, date: { gte: weekStart, lte: weekEnd }, status: 'DRAFT' },
            data: { status: 'SUBMITTED' },
        });
    }

    /** Approve timesheet */
    static async approve(prisma: PrismaClient, employeeId: number, weekStart: Date) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return db(prisma).timesheetEntry?.updateMany?.({
            where: { employeeId, date: { gte: weekStart, lte: weekEnd }, status: 'SUBMITTED' },
            data: { status: 'APPROVED' },
        });
    }

    /** Monthly summary */
    static async monthlySummary(prisma: PrismaClient, month: string) {
        const [year, m] = month.split('-').map(Number);
        const from = new Date(year, m - 1, 1);
        const to = new Date(year, m, 0);
        const entries = await db(prisma).timesheetEntry?.findMany?.({
            where: { date: { gte: from, lte: to }, status: 'APPROVED' },
        }) || [];

        const byEmployee: Record<number, { total: number; billable: number }> = {};
        for (const e of entries) {
            if (!byEmployee[e.employeeId]) byEmployee[e.employeeId] = { total: 0, billable: 0 };
            byEmployee[e.employeeId].total += Number(e.hours);
            if (e.billable) byEmployee[e.employeeId].billable += Number(e.hours);
        }
        return Object.entries(byEmployee).map(([empId, data]) => ({
            employeeId: Number(empId), ...data,
        }));
    }
}
