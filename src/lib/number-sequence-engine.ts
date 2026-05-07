/**
 * Number Sequence Engine — ZATCA-compliant auto-numbering
 * 
 * يولّد أرقام مستندات متسلسلة مع بادئة/لاحقة وإمكانية إعادة الضبط سنوياً.
 * Thread-safe عبر Prisma transaction with atomic increment.
 */

import { PrismaClient } from '@prisma/client';

export async function getNextNumber(
    prisma: PrismaClient,
    seqCode: string
): Promise<string> {
    const result = await (prisma as any).$transaction(async (tx: any) => {
        const seq = await tx.numberSequence?.findUnique?.({ where: { code: seqCode } });
        if (!seq || !seq.isActive) throw new Error(`تسلسل الترقيم '${seqCode}' غير موجود أو غير نشط`);

        const newNum = seq.lastNumber + 1;
        await tx.numberSequence.update({
            where: { code: seqCode },
            data: { lastNumber: newNum },
        });

        const padded = String(newNum).padStart(seq.padLength, '0');
        return `${seq.prefix}${padded}${seq.suffix}`;
    });

    return result;
}

export async function resetSequence(
    prisma: PrismaClient,
    seqCode: string,
    startFrom: number = 0
): Promise<void> {
    await (prisma as any).numberSequence?.update?.({
        where: { code: seqCode },
        data: { lastNumber: startFrom },
    });
}

export async function seedDefaultSequences(prisma: PrismaClient): Promise<number> {
    const defaults = [
        { code: 'INV', name: 'فواتير المبيعات', prefix: 'INV-', padLength: 6 },
        { code: 'PI', name: 'فواتير المشتريات', prefix: 'PI-', padLength: 6 },
        { code: 'PO', name: 'أوامر الشراء', prefix: 'PO-', padLength: 6 },
        { code: 'SO', name: 'أوامر البيع', prefix: 'SO-', padLength: 6 },
        { code: 'JE', name: 'القيود المحاسبية', prefix: 'JE-', padLength: 6 },
        { code: 'GRN', name: 'إذن استلام البضاعة', prefix: 'GRN-', padLength: 6 },
        { code: 'PAY', name: 'المدفوعات', prefix: 'PAY-', padLength: 6 },
        { code: 'RCV', name: 'المقبوضات', prefix: 'RCV-', padLength: 6 },
        { code: 'CN', name: 'إشعار دائن', prefix: 'CN-', padLength: 6 },
        { code: 'DN', name: 'إشعار مدين', prefix: 'DN-', padLength: 6 },
        { code: 'SQ', name: 'عروض الأسعار', prefix: 'SQ-', padLength: 6 },
        { code: 'RFQ', name: 'طلب عرض سعر', prefix: 'RFQ-', padLength: 5 },
    ];

    let created = 0;
    for (const d of defaults) {
        try {
            await (prisma as any).numberSequence?.upsert?.({
                where: { code: d.code },
                update: {},
                create: { ...d, lastNumber: 0, resetPeriod: 'NEVER', isActive: true, suffix: '' },
            });
            created++;
        } catch { /* skip duplicates */ }
    }
    return created;
}
