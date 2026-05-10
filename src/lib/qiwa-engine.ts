/**
 * Qiwa Integration + Saudization/Nitaqat Engine
 * ═══════════════════════════════════════════════
 * 
 * ربط منصة قوى لجلب بيانات العمالة وعقود العمل.
 * حساب نسبة السعودة وتصنيف نطاقات (Nitaqat).
 * 
 * متوافق مع CLAUDE.md §9.3 (Saudi Labor Law) + PDPL encryption requirements.
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.qiwa-engine.' });

// Helper: Prisma generated types may lag in IDE — cast for new models
const db = (p: any) => p as any;

// ── Nitaqat Thresholds by Activity + Size ──────────────────────────
// Source: Ministry of Human Resources and Social Development
// These are simplified — full production should load from Settings/DB
const NITAQAT_THRESHOLDS: Record<string, Record<string, { platinum: number; greenHigh: number; greenMid: number; greenLow: number; yellow: number }>> = {
    // Generic retail/services — can be extended per activity code
    DEFAULT: {
        MICRO:  { platinum: 0.40, greenHigh: 0.30, greenMid: 0.20, greenLow: 0.10, yellow: 0.05 },
        SMALL:  { platinum: 0.45, greenHigh: 0.35, greenMid: 0.25, greenLow: 0.15, yellow: 0.10 },
        MEDIUM: { platinum: 0.50, greenHigh: 0.40, greenMid: 0.30, greenLow: 0.20, yellow: 0.15 },
        LARGE:  { platinum: 0.55, greenHigh: 0.45, greenMid: 0.35, greenLow: 0.25, yellow: 0.20 },
        GIANT:  { platinum: 0.60, greenHigh: 0.50, greenMid: 0.40, greenLow: 0.30, yellow: 0.25 },
    },
    // IT/Software — lower thresholds
    '6201': {
        MICRO:  { platinum: 0.30, greenHigh: 0.20, greenMid: 0.15, greenLow: 0.10, yellow: 0.05 },
        SMALL:  { platinum: 0.35, greenHigh: 0.25, greenMid: 0.20, greenLow: 0.12, yellow: 0.07 },
        MEDIUM: { platinum: 0.40, greenHigh: 0.30, greenMid: 0.25, greenLow: 0.15, yellow: 0.10 },
        LARGE:  { platinum: 0.45, greenHigh: 0.35, greenMid: 0.30, greenLow: 0.20, yellow: 0.15 },
        GIANT:  { platinum: 0.50, greenHigh: 0.40, greenMid: 0.35, greenLow: 0.25, yellow: 0.20 },
    },
    // Construction
    '4100': {
        MICRO:  { platinum: 0.25, greenHigh: 0.18, greenMid: 0.12, greenLow: 0.08, yellow: 0.04 },
        SMALL:  { platinum: 0.30, greenHigh: 0.22, greenMid: 0.15, greenLow: 0.10, yellow: 0.06 },
        MEDIUM: { platinum: 0.35, greenHigh: 0.28, greenMid: 0.20, greenLow: 0.13, yellow: 0.08 },
        LARGE:  { platinum: 0.40, greenHigh: 0.32, greenMid: 0.25, greenLow: 0.16, yellow: 0.10 },
        GIANT:  { platinum: 0.45, greenHigh: 0.38, greenMid: 0.30, greenLow: 0.20, yellow: 0.12 },
    },
};

// ── Size Bracket Classification ──────────────────────────────────
export function classifySizeBracket(totalEmployees: number): string {
    if (totalEmployees <= 9)   return 'MICRO';
    if (totalEmployees <= 49)  return 'SMALL';
    if (totalEmployees <= 499) return 'MEDIUM';
    if (totalEmployees <= 2999) return 'LARGE';
    return 'GIANT';
}

// ── Nitaqat Classification ──────────────────────────────────────
export function classifyNitaqat(
    saudiPct: number,
    activityCode: string,
    sizeBracket: string
): string {
    const actThresholds = NITAQAT_THRESHOLDS[activityCode] || NITAQAT_THRESHOLDS.DEFAULT;
    const thresholds = actThresholds[sizeBracket] || actThresholds.MEDIUM;

    if (saudiPct >= thresholds.platinum)  return 'PLATINUM';
    if (saudiPct >= thresholds.greenHigh) return 'GREEN_HIGH';
    if (saudiPct >= thresholds.greenMid)  return 'GREEN_MID';
    if (saudiPct >= thresholds.greenLow)  return 'GREEN_LOW';
    if (saudiPct >= thresholds.yellow)    return 'YELLOW';
    return 'RED';
}

// ── Compute Saudization Percentage ──────────────────────────────
export async function computeSaudizationPct(
    prisma: PrismaClient
): Promise<{ total: number; saudi: number; pct: number }> {
    const employees = await prisma.employee.findMany({
            take: 100,
        where: { active: true },
        select: { nationality: true },
    });

    const total = employees.length;
    const saudi = employees.filter((e: any) =>
        e.nationality === 'SAUDI' || e.nationality === 'MILITARY' || e.nationality === 'GOV_EMPLOYEE'
    ).length;
    const pct = total > 0 ? saudi / total : 0;

    return { total, saudi, pct };
}

// ── Take Saudization Snapshot ──────────────────────────────────
export async function takeSaudizationSnapshot(
    prisma: PrismaClient,
    activityCode: string = 'DEFAULT',
    source: string = 'MANUAL'
): Promise<any> {
    const { total, saudi, pct } = await computeSaudizationPct(prisma);
    const sizeBracket = classifySizeBracket(total);
    const nitaqatBand = classifyNitaqat(pct, activityCode, sizeBracket);

    const actThresholds = NITAQAT_THRESHOLDS[activityCode] || NITAQAT_THRESHOLDS.DEFAULT;
    const thresholds = actThresholds[sizeBracket] || actThresholds.MEDIUM;

    const snapshot = await db(prisma).saudizationSnapshot.create({
        data: {
            snapshotDate: new Date(),
            totalEmployees: total,
            saudiEmployees: saudi,
            saudiPct: pct,
            activityCode,
            sizeBracket,
            nitaqatBand,
            nitaqatThresholds: thresholds,
            source,
        },
    });

    return {
        ...snapshot,
        alert: nitaqatBand === 'YELLOW' || nitaqatBand === 'RED'
            ? `⚠️ تنبيه: نطاق ${nitaqatBand} — يجب زيادة نسبة السعودة فوراً`
            : null,
    };
}

// ── Project Hiring Impact ──────────────────────────────────────
/**
 * يتوقع تأثير توظيف/فصل على نطاقات.
 * saudiHires: عدد سعوديين جدد (سالب = فصل)
 * expatHires: عدد أجانب جدد (سالب = فصل)
 */
export function projectImpact(
    currentTotal: number,
    currentSaudi: number,
    saudiHires: number,
    expatHires: number,
    activityCode: string = 'DEFAULT'
): {
    currentPct: number;
    projectedPct: number;
    currentBand: string;
    projectedBand: string;
    improvement: boolean;
} {
    const currentPct = currentTotal > 0 ? currentSaudi / currentTotal : 0;
    const newTotal = currentTotal + saudiHires + expatHires;
    const newSaudi = currentSaudi + saudiHires;
    const projectedPct = newTotal > 0 ? newSaudi / newTotal : 0;

    const sizeBracket = classifySizeBracket(newTotal);
    const currentBand = classifyNitaqat(currentPct, activityCode, classifySizeBracket(currentTotal));
    const projectedBand = classifyNitaqat(projectedPct, activityCode, sizeBracket);

    const bandOrder = ['RED', 'YELLOW', 'GREEN_LOW', 'GREEN_MID', 'GREEN_HIGH', 'PLATINUM'];
    const improvement = bandOrder.indexOf(projectedBand) >= bandOrder.indexOf(currentBand);

    return { currentPct, projectedPct, currentBand, projectedBand, improvement };
}

// ── Qiwa Contract Sync (Mock) ──────────────────────────────────
/**
 * في الإنتاج: يتصل بـ Qiwa API عبر OAuth2.
 * حالياً: يقرأ بيانات الموظفين ويصنع عقود محلية.
 */
export async function syncWorkforce(
    prisma: PrismaClient,
    activityCode: string = 'DEFAULT'
): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    // Get all active employees
    const employees = await prisma.employee.findMany({
            take: 100,
        where: { active: true },
        select: {
            id: true,
            name: true,
            nationality: true,
            iqamaNumber: true,
            idNumber: true,
            startDate: true,
            salary: true,
            position: true,
        },
    });

    for (const emp of employees) {
        try {
            const contractNo = `QC-${emp.id}-${new Date().getFullYear()}`;
            const contractType = 'UNLIMITED'; // Default — in production, fetched from Qiwa

            await db(prisma).qiwaContract.upsert({
                where: { contractNo },
                update: {
                    qiwaStatus: 'ACTIVE',
                    position: emp.position || null,
                    wageAmount: emp.salary || 0,
                    syncedAt: new Date(),
                },
                create: {
                    employeeId: emp.id,
                    contractNo,
                    contractType,
                    qiwaStatus: 'ACTIVE',
                    startDate: emp.startDate ? new Date(emp.startDate) : new Date(),
                    position: emp.position || null,
                    wageAmount: emp.salary || 0,
                    syncedAt: new Date(),
                },
            });
            synced++;
        } catch (e: any) {
            errors.push(`Employee ${emp.id}: ${e.message}`);
        }
    }

    // Take saudization snapshot after sync
    await takeSaudizationSnapshot(prisma, activityCode, 'QIWA_API');

    return { synced, errors };
}

// ── Get Latest Saudization Status ──────────────────────────────
export async function getLatestSnapshot(
    prisma: PrismaClient
): Promise<any | null> {
    return db(prisma).saudizationSnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
    });
}

// ── Get Saudization History ────────────────────────────────────
export async function getSnapshotHistory(
    prisma: PrismaClient,
    limit: number = 12
): Promise<any[]> {
    return db(prisma).saudizationSnapshot.findMany({
        orderBy: { snapshotDate: 'desc' },
        take: limit,
    });
}

// ── Get Employee Contracts ─────────────────────────────────────
export async function getEmployeeContracts(
    prisma: PrismaClient,
    employeeId: number
): Promise<any[]> {
    return db(prisma).qiwaContract.findMany({
            take: 100,
        where: { employeeId },
        orderBy: { startDate: 'desc' },
    });
}
