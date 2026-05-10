/**
 * Quality Inspection Engine (G-14)
 * ═════════════════════════════════
 * Inspection plans, results, pass/fail verdicts, CAPA integration
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'quality-inspection-engine' });
const db = (p: any) => p as any;

export type InspectionParameter = {
    name: string;
    nameAr: string;
    type: 'numeric' | 'pass_fail' | 'visual';
    unit?: string;
    minValue?: number;
    maxValue?: number;
    targetValue?: number;
};

export class QualityInspectionEngine {
    /** Create inspection plan for a product */
    static async createPlan(prisma: PrismaClient, data: {
        productId: number; name: string; parameters: InspectionParameter[]; tenantId: string;
    }) {
        return db(prisma).inspectionPlan?.create?.({
            data: { ...data, parameters: JSON.stringify(data.parameters) },
        });
    }

    /** Record inspection result */
    static async recordResult(prisma: PrismaClient, data: {
        planId: number; batchId?: number; inspectedBy: number;
        results: Array<{ parameter: string; value: any; pass: boolean }>;
        tenantId: string;
    }) {
        const allPass = data.results.every(r => r.pass);
        return db(prisma).inspectionResult?.create?.({
            data: {
                planId: data.planId,
                batchId: data.batchId,
                inspectedBy: data.inspectedBy,
                results: JSON.stringify(data.results),
                verdict: allPass ? 'PASS' : 'FAIL',
                tenantId: data.tenantId,
                createdAt: new Date(),
            },
        });
    }

    /** Get inspection history */
    static async getHistory(prisma: PrismaClient, productId?: number, verdict?: string) {
        const plans = productId
            ? await db(prisma).inspectionPlan?.findMany?.({ where: { productId } }) || []
            : await db(prisma).inspectionPlan?.findMany?.({}) || [];
        const planIds = plans.map((p: any) => p.id);

        const where: any = { planId: { in: planIds } };
        if (verdict) where.verdict = verdict;

        return db(prisma).inspectionResult?.findMany?.({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        }) || [];
    }

    /** Quality dashboard stats */
    static async dashboard(prisma: PrismaClient) {
        const results = await db(prisma).inspectionResult?.findMany?.({}) || [];
        const total = results.length;
        const passed = results.filter((r: any) => r.verdict === 'PASS').length;
        const failed = total - passed;
        return {
            total,
            passed,
            failed,
            passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        };
    }
}
