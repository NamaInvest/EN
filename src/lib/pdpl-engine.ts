/**
 * PDPL Compliance Engine
 * ═══════════════════════
 * 
 * نظام حماية البيانات الشخصية (PDPL) — المملكة العربية السعودية
 * يدير: طلبات أصحاب البيانات (DSR)، الموافقات، حوادث الاختراق
 * 
 * الغرامة: حتى 5 مليون ريال سعودي
 * 
 * PDPL Art 12: 30 يوم للرد على طلبات الوصول/الحذف
 * PDPL Art 20: 72 ساعة لإبلاغ SDAIA عن الاختراقات الحرجة
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pdpl-engine' });

const db = (p: any) => p as any;

// ── PII Fields Registry ──────────────────────────────────────────
// Maps table names to their PII fields for data subject requests
const PII_REGISTRY: Record<string, string[]> = {
    employees: ['name', 'phone', 'iqamaNumber', 'passportNumber', 'idNumber', 'iban', 'bankName', 'faceDescriptor'],
    customers: ['name', 'phone', 'email', 'address', 'taxNumber', 'idNumber'],
    vendors: ['name', 'phone', 'email', 'address', 'taxNumber'],
    users: ['name', 'email', 'phone'],
};

// ── Create Data Subject Request ─────────────────────────────────
export async function createDSR(
    prisma: PrismaClient,
    data: {
        requestType: string; // ACCESS | ERASE | RECTIFY | RESTRICT | PORTABILITY
        subjectType: string; // EMPLOYEE | CUSTOMER | VENDOR | USER
        subjectId: number;
        subjectIdentifier: string;
    }
): Promise<any> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // PDPL Art 12: 30 days

    return db(prisma).pdplDataSubjectRequest.create({
        data: {
            requestType: data.requestType,
            subjectType: data.subjectType,
            subjectId: data.subjectId,
            subjectIdentifier: data.subjectIdentifier,
            status: 'RECEIVED',
            dueDate,
        },
    });
}

// ── Fulfill Access Request ──────────────────────────────────────
export async function fulfillAccess(
    prisma: PrismaClient,
    requestId: number,
    handledByUserId: number
): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    const dsr = await db(prisma).pdplDataSubjectRequest.findUnique({ where: { id: requestId } });
    if (!dsr) return { success: false, error: 'الطلب غير موجود' };
    if (dsr.status === 'COMPLETED') return { success: false, error: 'تم معالجة الطلب مسبقاً' };

    const tableName = dsr.subjectType.toLowerCase() + 's'; // EMPLOYEE → employees
    const piiFields = PII_REGISTRY[tableName];
    if (!piiFields) return { success: false, error: `لا توجد بيانات شخصية مسجلة لنوع: ${dsr.subjectType}` };

    // Fetch subject data
    let subjectData: any = null;
    try {
        subjectData = await (db(prisma) as any)[dsr.subjectType.toLowerCase()].findUnique({
            where: { id: dsr.subjectId },
        });
    } catch {
        return { success: false, error: 'فشل جلب البيانات — تحقق من نوع البيانات' };
    }

    if (!subjectData) return { success: false, error: 'صاحب البيانات غير موجود' };

    // Filter to PII fields only
    const piiData: Record<string, any> = {};
    for (const field of piiFields) {
        if (subjectData[field] !== undefined) {
            piiData[field] = subjectData[field];
        }
    }

    // Mark as completed
    await db(prisma).pdplDataSubjectRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED', completedAt: new Date(), handledByUserId },
    });

    return { success: true, data: piiData };
}

// ── Erase Subject Data (Anonymize) ──────────────────────────────
/**
 * لا نحذف السجلات — نُجهّل البيانات الشخصية فقط.
 * الفواتير تبقى للامتثال لـ ZATCA (6 سنوات).
 */
export async function eraseSubject(
    prisma: PrismaClient,
    requestId: number,
    handledByUserId: number
): Promise<{ success: boolean; anonymizedFields?: string[]; error?: string }> {
    const dsr = await db(prisma).pdplDataSubjectRequest.findUnique({ where: { id: requestId } });
    if (!dsr) return { success: false, error: 'الطلب غير موجود' };
    if (dsr.requestType !== 'ERASE') return { success: false, error: 'هذا ليس طلب حذف' };

    const tableName = dsr.subjectType.toLowerCase() + 's';
    const piiFields = PII_REGISTRY[tableName];
    if (!piiFields) return { success: false, error: 'نوع غير مدعوم' };

    // Build anonymization update
    const anonymizeData: Record<string, any> = {};
    for (const field of piiFields) {
        if (field === 'name') anonymizeData[field] = '[محذوف بموجب PDPL]';
        else if (field === 'email') anonymizeData[field] = `erased_${dsr.subjectId}@pdpl.local`;
        else anonymizeData[field] = null;
    }

    try {
        const model = dsr.subjectType.toLowerCase();
        await (db(prisma) as any)[model].update({
            where: { id: dsr.subjectId },
            data: anonymizeData,
        });

        await db(prisma).pdplDataSubjectRequest.update({
            where: { id: requestId },
            data: { status: 'COMPLETED', completedAt: new Date(), handledByUserId },
        });

        return { success: true, anonymizedFields: Object.keys(anonymizeData) };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ── Record Breach Incident ──────────────────────────────────────
export async function recordBreach(
    prisma: PrismaClient,
    data: {
        category: string;
        severity: string;
        affectedRecords: number;
        affectedDataCategories?: string[];
        rootCause?: string;
        ownerUserId?: number;
    }
): Promise<any> {
    const incident = await db(prisma).pdplBreachIncident.create({
        data: {
            detectedAt: new Date(),
            category: data.category,
            severity: data.severity,
            affectedRecords: data.affectedRecords,
            affectedDataCategories: data.affectedDataCategories || [],
            rootCause: data.rootCause || null,
            ownerUserId: data.ownerUserId || null,
            status: 'DETECTED',
        },
    });

    return {
        ...incident,
        alert: data.severity === 'HIGH' || data.severity === 'CRITICAL'
            ? '⚠️ يجب إبلاغ SDAIA خلال 72 ساعة (PDPL Art 20)'
            : null,
        deadline72h: data.severity === 'HIGH' || data.severity === 'CRITICAL'
            ? new Date(Date.now() + 72 * 60 * 60 * 1000)
            : null,
    };
}

// ── Get DSR Queue (Pending requests) ────────────────────────────
export async function getDSRQueue(
    prisma: PrismaClient
): Promise<any[]> {
    return db(prisma).pdplDataSubjectRequest.findMany({
            take: 100,
        where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
    });
}

// ── Get Overdue DSRs ────────────────────────────────────────────
export async function getOverdueDSRs(
    prisma: PrismaClient
): Promise<any[]> {
    return db(prisma).pdplDataSubjectRequest.findMany({
            take: 100,
        where: {
            status: { in: ['RECEIVED', 'IN_PROGRESS'] },
            dueDate: { lt: new Date() },
        },
        orderBy: { dueDate: 'asc' },
    });
}

// ── Check Consent ───────────────────────────────────────────────
export async function checkConsent(
    prisma: PrismaClient,
    subjectType: string,
    subjectId: number,
    purpose: string
): Promise<boolean> {
    const consent = await db(prisma).pdplConsent.findUnique({
        where: { subjectType_subjectId_purpose: { subjectType, subjectId, purpose } },
    });
    return consent?.granted === true && !consent.revokedAt;
}

// ── Record/Update Consent ───────────────────────────────────────
export async function recordConsent(
    prisma: PrismaClient,
    data: {
        subjectType: string;
        subjectId: number;
        purpose: string;
        granted: boolean;
        legalBasis: string;
    }
): Promise<any> {
    return db(prisma).pdplConsent.upsert({
        where: {
            subjectType_subjectId_purpose: {
                subjectType: data.subjectType,
                subjectId: data.subjectId,
                purpose: data.purpose,
            },
        },
        update: {
            granted: data.granted,
            grantedAt: data.granted ? new Date() : null,
            revokedAt: !data.granted ? new Date() : null,
        },
        create: {
            subjectType: data.subjectType,
            subjectId: data.subjectId,
            purpose: data.purpose,
            granted: data.granted,
            grantedAt: data.granted ? new Date() : null,
            legalBasis: data.legalBasis,
        },
    });
}

// ── Get Active Breaches ─────────────────────────────────────────
export async function getActiveBreaches(
    prisma: PrismaClient
): Promise<any[]> {
    return db(prisma).pdplBreachIncident.findMany({
            take: 100,
        where: { status: { in: ['DETECTED', 'CONTAINED', 'INVESTIGATING'] } },
        orderBy: { detectedAt: 'desc' },
    });
}
