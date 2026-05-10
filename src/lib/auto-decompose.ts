/**
 * Auto-Decompose Unit Stock
 * ===========================
 * عند بيع كمية تتجاوز مخزون الحبات (الوحدة الأساسية)،
 * تلقائياً يُفتح من المستوى الأعلى (درزن → كرتون) ويُحسب باقي الحبات.
 *
 * مثال:
 *   مخزون: 2 كرتون | 3 درزن | 5 حبة
 *   بيع: 10 حبة
 *   → حبة: 5 - 10 = -5 → فتح 1 درزن
 *   → حبة: -5 + 24 = 19 | درزن: 2
 *   النتيجة: 2 كرتون | 2 درزن | 9 حبة
 */

import { PrismaClient } from '@prisma/client';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.auto-decompo' });

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * بعد خصم qty من product.currentStock ،
 * إذا أصبح سالباً → افتح وحدات أعلى تلقائياً
 */
export async function autoDecomposeIfNeeded(
    tx: TxClient,
    productId: number,
    soldQty: number
): Promise<{ decomposed: boolean; log: string[] }> {
    const log: string[] = [];

    // جلب المنتج بعد الخصم
    const product = await tx.product.findUnique({
        where: { id: productId },
        select: { currentStock: true },
    });
    if (!product) return { decomposed: false, log };

    if (n(product.currentStock) >= 0) return { decomposed: false, log }; // مخزون كافٍ

    // جلب جميع وحدات المنتج مرتبة من الأصغر للأكبر
    const units = await tx.productUnit.findMany({
            take: 100,
        where: { productId },
        include: { unit: true },
        orderBy: { sortOrder: 'asc' },
    });

    if (units.length === 0) return { decomposed: false, log };

    // بناء تسلسل هرمي: من الأصغر (factor صغير) للأكبر
    const sorted = [...units].sort((a, b) => n(a.factor) - n(b.factor));

    let deficit = Math.abs(n(product.currentStock)); // العجز بالحبات
    let decomposed = false;

    for (const unit of sorted) {
        if (deficit <= 0) break;
        if (n(unit.unitStock) <= 0) continue; // لا يوجد من هذه الوحدة

        // كم وحدة نحتاج نفتح
        const unitsToBreak = Math.ceil(deficit / n(unit.factor));
        const actualBreak = Math.min(unitsToBreak, n(unit.unitStock));
        const addedPieces = actualBreak * n(unit.factor);

        // خصم من مخزون الوحدة
        await tx.productUnit.update({
            where: { id: unit.id },
            data: { unitStock: { decrement: actualBreak } },
        });

        // أضف الحبات للمنتج الأساسي
        await tx.product.update({
            where: { id: productId },
            data: { currentStock: { increment: addedPieces } },
        });

        log.push(`✂️ فُتح ${actualBreak} ${unit.unit.name} → أُضيف ${addedPieces} حبة`);
        deficit = Math.max(0, deficit - addedPieces);
        decomposed = true;

        // تحقق هل المخزون نظيف الآن
        const refreshed = await tx.product.findUnique({
            where: { id: productId },
            select: { currentStock: true },
        });
        if (n(refreshed?.currentStock ?? 0) >= 0) break;
    }

    return { decomposed, log };
}
