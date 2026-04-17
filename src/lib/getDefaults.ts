/**
 * getDefaults.ts
 * ─────────────────────────────────────────────────────────
 * دالة مركزية لحل stockId و branchId في كل معاملة.
 *
 * المنطق:
 *  1. stockId  → يُستخدم ما أرسله العميل، أو id=1 افتراضياً
 *  2. branchId → يُجلب من Stock.branchId (الفرع المرتبط بالمستودع)
 *               فإذا لم يكن للمستودع فرع → يُستخدم fallback (user.branchId أو null)
 *
 * هذا يضمن:
 *  - كل معاملة مالية تعرف مستودعها وفرعها بدقة
 *  - لا لخبطة في الحسابات عند وجود فروع/مستودعات متعددة
 */

import prisma from './prisma';

interface ResolveResult {
    stockId: number;
    branchId: number | null;
}

/**
 * يحل stockId و branchId بالترتيب الصحيح:
 * @param requestedStockId - المستودع المحدد من العميل (اختياري)
 * @param fallbackBranchId - الفرع الاحتياطي (من المستخدم مثلاً)
 */
export async function resolveStockAndBranch(
    requestedStockId?: number | string | null,
    fallbackBranchId?: number | null
): Promise<ResolveResult> {
    // 1. حل الـ stockId
    const stockId = requestedStockId ? Number(requestedStockId) : 1;

    // 2. جلب الفرع من المستودع مباشرةً
    const stock = await prisma.stock.findUnique({
        where: { id: stockId },
        select: { branchId: true },
    });

    // 3. الفرع: من المستودع أولاً → fallback → null
    const branchId = stock?.branchId ?? fallbackBranchId ?? null;

    return { stockId, branchId };
}

/**
 * يجلب id المستودع الرئيسي (الأول النشط في القاعدة)
 */
export async function getMainStockId(): Promise<number> {
    const stock = await prisma.stock.findFirst({
        where: { active: true },
        orderBy: { id: 'asc' },
        select: { id: true },
    });
    return stock?.id ?? 1;
}

/**
 * يجلب id الفرع الرئيسي (الأول في القاعدة)
 */
export async function getMainBranchId(): Promise<number | null> {
    const branch = await prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { id: 'asc' },
        select: { id: true },
    });
    return branch?.id ?? null;
}
