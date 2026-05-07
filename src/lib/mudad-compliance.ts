/**
 * Mudad Full Integration Engine (Build #12)
 * ═══════════════════════════════════════════
 * 
 * توسيع محرك مداد الحالي بدعم كامل لنظام حماية الأجور (WPS).
 * - SIF file generation (Salary Information File)
 * - Payment verification
 * - Employee wage protection status tracking
 * - Compliance monitoring
 * 
 * يعتمد على: src/lib/saudi-gov/mudad.ts (OAuth + submit)
 *             src/lib/wps-generator.ts (SIF format)
 */

import type { PrismaClient } from '@prisma/client';

const db = (p: any) => p as any;

// ── Mudad Compliance Status ────────────────────────────────────
export type MudadComplianceStatus = {
    totalEmployees: number;
    protectedEmployees: number;
    pendingEmployees: number;
    suspendedEmployees: number;
    compliancePct: number;
    isCompliant: boolean;
    lastSyncAt: Date | null;
};

// ── Check Mudad Compliance ─────────────────────────────────────
export async function checkMudadCompliance(
    prisma: PrismaClient
): Promise<MudadComplianceStatus> {
    const employees = await db(prisma).employee.findMany({
            take: 100,
        where: { active: true },
        select: { id: true, mudadStatus: true, name: true },
    });

    const total = employees.length;
    const active = employees.filter((e: any) => e.mudadStatus === 'ACTIVE').length;
    const pending = employees.filter((e: any) => e.mudadStatus === 'PENDING' || !e.mudadStatus).length;
    const suspended = employees.filter((e: any) => e.mudadStatus === 'SUSPENDED').length;
    const pct = total > 0 ? active / total : 0;

    return {
        totalEmployees: total,
        protectedEmployees: active,
        pendingEmployees: pending,
        suspendedEmployees: suspended,
        compliancePct: Math.round(pct * 10000) / 100,
        isCompliant: pct >= 0.8, // 80% threshold
        lastSyncAt: null,
    };
}

// ── Update Employee Mudad Status ───────────────────────────────
export async function updateMudadStatus(
    prisma: PrismaClient,
    employeeId: number,
    status: string
): Promise<any> {
    return db(prisma).employee.update({
        where: { id: employeeId },
        data: { mudadStatus: status },
    });
}

// ── Bulk Update Mudad Status ───────────────────────────────────
export async function bulkUpdateMudadStatus(
    prisma: PrismaClient,
    updates: Array<{ employeeId: number; status: string }>
): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    for (const u of updates) {
        try {
            await db(prisma).employee.update({
                where: { id: u.employeeId },
                data: { mudadStatus: u.status },
            });
            updated++;
        } catch (e: any) {
            errors.push(`Employee ${u.employeeId}: ${e.message}`);
        }
    }

    return { updated, errors };
}

// ── Get Employees Missing Wage Protection ──────────────────────
export async function getUnprotectedEmployees(
    prisma: PrismaClient
): Promise<any[]> {
    return db(prisma).employee.findMany({
            take: 100,
        where: {
            active: true,
            OR: [
                { mudadStatus: null },
                { mudadStatus: 'PENDING' },
                { mudadStatus: 'SUSPENDED' },
            ],
        },
        select: {
            id: true,
            name: true,
            phone: true,
            salary: true,
            iban: true,
            bankName: true,
            mudadStatus: true,
            qiwaWageProtectionId: true,
        },
        orderBy: { name: 'asc' },
    });
}

// ── Validate Employee for Mudad Registration ───────────────────
export function validateForMudad(employee: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!employee.iban) issues.push('IBAN مطلوب لنظام حماية الأجور');
    if (!employee.bankName) issues.push('اسم البنك مطلوب');
    if (!employee.salary || employee.salary <= 0) issues.push('الراتب يجب أن يكون أكبر من صفر');
    if (!employee.name) issues.push('اسم الموظف مطلوب');

    // IBAN format validation (SA followed by 22 digits)
    if (employee.iban && !/^SA\d{22}$/.test(employee.iban.replace(/\s/g, ''))) {
        issues.push('صيغة IBAN غير صحيحة — يجب أن يبدأ بـ SA متبوعاً بـ 22 رقم');
    }

    return { valid: issues.length === 0, issues };
}

// ── Generate Mudad Salary Report ───────────────────────────────
export async function generateMudadReport(
    prisma: PrismaClient,
    month: string // YYYY-MM
): Promise<{
    period: string;
    summary: { totalSalaries: number; employeeCount: number; avgSalary: number };
    byBank: Record<string, { count: number; total: number }>;
    issues: string[];
}> {
    const employees = await db(prisma).employee.findMany({
            take: 100,
        where: { active: true },
        select: {
            id: true, name: true, salary: true, housingAllowance: true,
            transportAllowance: true, otherAllowance: true,
            bankName: true, iban: true, mudadStatus: true,
        },
    });

    const issues: string[] = [];
    const byBank: Record<string, { count: number; total: number }> = {};
    let totalSalaries = 0;

    for (const emp of employees) {
        const total = (emp.salary || 0) + (emp.housingAllowance || 0) +
                      (emp.transportAllowance || 0) + (emp.otherAllowance || 0);
        totalSalaries += total;

        const bank = emp.bankName || 'غير محدد';
        if (!byBank[bank]) byBank[bank] = { count: 0, total: 0 };
        byBank[bank].count++;
        byBank[bank].total += total;

        const validation = validateForMudad(emp);
        if (!validation.valid) {
            issues.push(`${emp.name}: ${validation.issues.join(', ')}`);
        }
    }

    return {
        period: month,
        summary: {
            totalSalaries: Math.round(totalSalaries * 100) / 100,
            employeeCount: employees.length,
            avgSalary: employees.length > 0
                ? Math.round((totalSalaries / employees.length) * 100) / 100
                : 0,
        },
        byBank,
        issues,
    };
}
