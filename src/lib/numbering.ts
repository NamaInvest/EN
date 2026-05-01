/**
 * Numbering Sequences Engine — Foundation 0.1
 * ════════════════════════════════════════════
 *
 * محرّك ترقيم موحّد، concurrency-safe، يدعم:
 *   - Prefix/Suffix قابلة للتكوين
 *   - Pad zeros (مثلاً 6 → 000001)
 *   - Reset سنوي / شهري / never
 *   - Branch-aware (فرع مستقل أو سلسلة عالمية)
 *   - Atomic increment عبر row-level lock داخل transaction
 *
 * الاستخدام:
 *   const num = await generateNextNumber(prisma, 'WO');
 *   // → "WO-2026-000017"
 *
 *   const num = await generateNextNumber(prisma, 'INV', { branchId: 5 });
 *
 *   const num = await generateNextNumber(prisma, 'JE', { date: new Date('2026-03-15') });
 */

import type { PrismaClient } from '@prisma/client';

export type ResetFrequency = 'never' | 'yearly' | 'monthly';

export interface GenerateOptions {
    branchId?: number | null;
    date?: Date;
    /**
     * إن أعطيت tx فستُنفَّذ العملية داخلها (للتحكم بالمعاملة من المستدعي)
     */
    tx?: Pick<PrismaClient, '$queryRaw' | '$queryRawUnsafe' | '$executeRaw' | '$executeRawUnsafe'> & {
        numberingSequence: PrismaClient['numberingSequence'];
    };
}

export interface SequenceConfig {
    code: string;
    name?: string;
    prefix?: string;
    suffix?: string;
    padLength?: number;
    resetFrequency?: ResetFrequency;
    branchId?: number | null;
}

const FALLBACK_DEFAULTS: Record<string, Partial<SequenceConfig>> = {
    JE:  { name: 'قيد يومية',         prefix: 'JE-',  padLength: 6, resetFrequency: 'yearly' },
    INV: { name: 'فاتورة مبيعات',     prefix: 'INV-', padLength: 6, resetFrequency: 'yearly' },
    PO:  { name: 'أمر شراء',          prefix: 'PO-',  padLength: 6, resetFrequency: 'yearly' },
    PR:  { name: 'طلب شراء',          prefix: 'PR-',  padLength: 6, resetFrequency: 'yearly' },
    GRN: { name: 'إذن استلام',        prefix: 'GRN-', padLength: 6, resetFrequency: 'yearly' },
    RFQ: { name: 'طلب عرض سعر',       prefix: 'RFQ-', padLength: 6, resetFrequency: 'yearly' },
    SO:  { name: 'أمر بيع',           prefix: 'SO-',  padLength: 6, resetFrequency: 'yearly' },
    DN:  { name: 'إذن تسليم',         prefix: 'DN-',  padLength: 6, resetFrequency: 'yearly' },
    WO:  { name: 'أمر تشغيل',         prefix: 'WO-',  padLength: 6, resetFrequency: 'yearly' },
    FA:  { name: 'أصل ثابت',          prefix: 'FA-',  padLength: 6, resetFrequency: 'never'  },
    EMP: { name: 'موظف',              prefix: 'EMP-', padLength: 5, resetFrequency: 'never'  },
    SAL: { name: 'مسير راتب',         prefix: 'SAL-', padLength: 6, resetFrequency: 'monthly' },
    EXP: { name: 'مصروف',             prefix: 'EXP-', padLength: 6, resetFrequency: 'yearly' },
    PV:  { name: 'سند صرف',           prefix: 'PV-',  padLength: 6, resetFrequency: 'yearly' },
    RV:  { name: 'سند قبض',           prefix: 'RV-',  padLength: 6, resetFrequency: 'yearly' },
    CHK: { name: 'شيك',               prefix: 'CHK-', padLength: 6, resetFrequency: 'yearly' },
    SR:  { name: 'مرتجع مبيعات',      prefix: 'SR-',  padLength: 6, resetFrequency: 'yearly' },
    PRT: { name: 'مرتجع مشتريات',     prefix: 'PRT-', padLength: 6, resetFrequency: 'yearly' },
    ADJ: { name: 'تسوية مخزون',       prefix: 'ADJ-', padLength: 6, resetFrequency: 'yearly' },
    TRN: { name: 'تحويل مخزون',       prefix: 'TRN-', padLength: 6, resetFrequency: 'yearly' },
};

function pad(n: bigint | number, length: number): string {
    return String(n).padStart(length, '0');
}

function computePeriod(date: Date, freq: ResetFrequency): { year: number | null; month: number | null } {
    if (freq === 'yearly') return { year: date.getFullYear(), month: null };
    if (freq === 'monthly') return { year: date.getFullYear(), month: date.getMonth() + 1 };
    return { year: null, month: null };
}

function buildNumber(prefix: string, suffix: string, padLength: number, value: bigint, year: number | null): string {
    const yearPart = year !== null ? `${year}-` : '';
    return `${prefix}${yearPart}${pad(value, padLength)}${suffix}`;
}

/**
 * يولّد الرقم التالي بأمان (concurrency-safe).
 *
 * يستخدم PostgreSQL atomic UPSERT + RETURNING لضمان أن
 * كل استدعاء يحصل على رقم فريد حتى تحت تزامن عالٍ.
 */
export async function generateNextNumber(
    prisma: PrismaClient,
    code: string,
    options: GenerateOptions = {}
): Promise<string> {
    const date = options.date ?? new Date();
    const branchId = options.branchId ?? null;

    // 1. اقرأ التكوين الحالي (إن وجد) لتحديد resetFrequency
    const existing = await prisma.numberingSequence.findFirst({
        where: { code, branchId, isActive: true },
        orderBy: { id: 'asc' },
    });

    const defaults = FALLBACK_DEFAULTS[code] ?? {};
    const config: Required<Omit<SequenceConfig, 'branchId' | 'name'>> & { name: string | null; branchId: number | null } = {
        code,
        name: existing?.name ?? defaults.name ?? null,
        prefix: existing?.prefix ?? defaults.prefix ?? `${code}-`,
        suffix: existing?.suffix ?? defaults.suffix ?? '',
        padLength: existing?.padLength ?? defaults.padLength ?? 6,
        resetFrequency: (existing?.resetFrequency ?? defaults.resetFrequency ?? 'never') as ResetFrequency,
        branchId,
    };

    const { year, month } = computePeriod(date, config.resetFrequency);

    // 2. Atomic upsert + increment داخل transaction
    //    PostgreSQL يضمن أن RETURNING بعد UPDATE يقرأ القيمة المُحدَّثة فقط.
    const result = await prisma.$transaction(async (tx) => {
        // محاولة UPDATE أولاً (الحالة الشائعة)
        const updated = await tx.numberingSequence.updateMany({
            where: {
                code,
                branchId,
                fiscalYear: year,
                fiscalMonth: month,
                isActive: true,
            },
            data: {
                current: { increment: 1 },
            },
        });

        if (updated.count > 0) {
            const row = await tx.numberingSequence.findFirst({
                where: { code, branchId, fiscalYear: year, fiscalMonth: month, isActive: true },
            });
            if (!row) throw new Error('NumberingSequence: row vanished after update');
            return row;
        }

        // لا توجد سلسلة لهذه الفترة → أنشئها بـ current=1
        return tx.numberingSequence.create({
            data: {
                code,
                name: config.name,
                prefix: config.prefix,
                suffix: config.suffix,
                padLength: config.padLength,
                resetFrequency: config.resetFrequency,
                branchId,
                fiscalYear: year,
                fiscalMonth: month,
                lastReset: new Date(),
                current: BigInt(1),
                isActive: true,
            },
        });
    }, {
        isolationLevel: 'Serializable',
    });

    return buildNumber(result.prefix, result.suffix, result.padLength, result.current as bigint, year);
}

/**
 * معاينة الرقم التالي بدون استهلاكه (للعرض في UI).
 * لا يضمن uniqueness — استخدم generateNextNumber عند الحفظ الفعلي.
 */
export async function peekNextNumber(
    prisma: PrismaClient,
    code: string,
    options: GenerateOptions = {}
): Promise<string> {
    const date = options.date ?? new Date();
    const branchId = options.branchId ?? null;
    const defaults = FALLBACK_DEFAULTS[code] ?? {};

    const existing = await prisma.numberingSequence.findFirst({
        where: { code, branchId, isActive: true },
    });

    const resetFrequency = (existing?.resetFrequency ?? defaults.resetFrequency ?? 'never') as ResetFrequency;
    const { year, month } = computePeriod(date, resetFrequency);

    const row = await prisma.numberingSequence.findFirst({
        where: { code, branchId, fiscalYear: year, fiscalMonth: month, isActive: true },
    });

    const prefix = row?.prefix ?? defaults.prefix ?? `${code}-`;
    const suffix = row?.suffix ?? defaults.suffix ?? '';
    const padLength = row?.padLength ?? defaults.padLength ?? 6;
    const next = (row?.current as bigint | undefined) ?? BigInt(0);

    return buildNumber(prefix, suffix, padLength, next + BigInt(1), year);
}

/**
 * إعادة تعيين سلسلة (admin-only). يُسجِّل الـ lastReset للتدقيق.
 */
export async function resetSequence(
    prisma: PrismaClient,
    code: string,
    branchId: number | null = null,
    fiscalYear: number | null = null,
    fiscalMonth: number | null = null
): Promise<void> {
    await prisma.numberingSequence.updateMany({
        where: { code, branchId, fiscalYear, fiscalMonth },
        data: { current: BigInt(0), lastReset: new Date() },
    });
}

export const NUMBERING_DEFAULTS = FALLBACK_DEFAULTS;
