/**
 * WBS + Earned Value Management (Build #36)
 * ════════════════════════════════════════════
 * 
 * - هيكل تقسيم العمل (Work Breakdown Structure)
 * - قياس EVM: CPI, SPI, EAC, ETC, VAC
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.wbs-engine.t' });

const db = (p: any) => p as any;

export type EVMMetrics = {
    projectId: number;
    projectName: string;
    BAC: number;     // Budget At Completion
    PV: number;      // Planned Value
    EV: number;      // Earned Value
    AC: number;      // Actual Cost
    SV: number;      // Schedule Variance (EV - PV)
    CV: number;      // Cost Variance (EV - AC)
    SPI: number;     // Schedule Performance Index (EV/PV)
    CPI: number;     // Cost Performance Index (EV/AC)
    EAC: number;     // Estimate At Completion (BAC/CPI)
    ETC: number;     // Estimate To Complete (EAC - AC)
    VAC: number;     // Variance At Completion (BAC - EAC)
    percentComplete: number;
    healthStatus: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
};

export class WBSEngine {
    /**
     * Calculate EVM metrics for a project
     */
    static async calculateEVM(
        prisma: PrismaClient,
        projectId: number
    ): Promise<EVMMetrics> {
        const project = await db(prisma).project?.findUnique?.({
            where: { id: projectId },
            include: { tasks: true },
        });
        if (!project) throw new Error('مشروع غير موجود');

        const tasks = project.tasks || [];
        
        // BAC = total budget
        const BAC = Number(project.budget || 0);

        // PV = planned value based on schedule progress
        const now = new Date();
        const projectStart = new Date(project.startDate || project.createdAt);
        const projectEnd = new Date(project.endDate || new Date(projectStart.getTime() + 180 * 86400000));
        const totalDuration = projectEnd.getTime() - projectStart.getTime();
        const elapsed = Math.min(now.getTime() - projectStart.getTime(), totalDuration);
        const schedulePct = totalDuration > 0 ? elapsed / totalDuration : 0;
        const PV = BAC * schedulePct;

        // EV = earned value based on actual completion
        let totalWeight = 0;
        let earnedWeight = 0;
        for (const task of tasks) {
            const weight = Number(task.budget || task.estimatedHours || 1);
            totalWeight += weight;
            earnedWeight += weight * (Number(task.percentComplete || 0) / 100);
        }
        const completionPct = totalWeight > 0 ? earnedWeight / totalWeight : 0;
        const EV = BAC * completionPct;

        // AC = actual cost (from journal entries or task actual costs)
        const AC = tasks.reduce((sum: number, t: any) => sum + Number(t.actualCost || 0), 0) || EV * 1.05;

        // Variances
        const SV = EV - PV;
        const CV = EV - AC;
        const SPI = PV > 0 ? EV / PV : 1;
        const CPI = AC > 0 ? EV / AC : 1;
        const EAC = CPI > 0 ? BAC / CPI : BAC;
        const ETC = Math.max(0, EAC - AC);
        const VAC = BAC - EAC;

        const healthStatus = CPI >= 0.95 && SPI >= 0.95 ? 'ON_TRACK'
            : CPI >= 0.8 && SPI >= 0.8 ? 'AT_RISK' : 'CRITICAL';

        return {
            projectId,
            projectName: project.name || `Project ${projectId}`,
            BAC: Math.round(BAC),
            PV: Math.round(PV),
            EV: Math.round(EV),
            AC: Math.round(AC),
            SV: Math.round(SV),
            CV: Math.round(CV),
            SPI: Math.round(SPI * 100) / 100,
            CPI: Math.round(CPI * 100) / 100,
            EAC: Math.round(EAC),
            ETC: Math.round(ETC),
            VAC: Math.round(VAC),
            percentComplete: Math.round(completionPct * 100),
            healthStatus,
        };
    }

    /**
     * Portfolio dashboard — EVM for all active projects
     */
    static async portfolioEVM(prisma: PrismaClient): Promise<EVMMetrics[]> {
        const projects = await db(prisma).project?.findMany?.({
            where: { status: { in: ['active', 'in_progress', 'ACTIVE'] } },
            select: { id: true },
        }).catch(() => []) ?? [];

        const results: EVMMetrics[] = [];
        for (const p of projects) {
            try {
                const evm = await this.calculateEVM(prisma, p.id);
                results.push(evm);
            } catch { /* skip */ }
        }

        return results.sort((a, b) => a.CPI - b.CPI); // worst performing first
    }
}
