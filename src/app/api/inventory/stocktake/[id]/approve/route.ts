import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { InventoryAdjustmentService } from '@/lib/services/inventory-adjustment.service';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';
import { getUserFromRequest } from '@/lib/auth';

const log = logger.child({ service: 'inventory.stocktake.id.approve' });

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        
        // Fetch stocktake and its items
        // جلب سجل الجرد والبنود التابعة له مع المنتجات لحساب تكاليف التسوية
        const stocktake = await prisma.stocktake.findUnique({
            where: { id },
            include: { items: { include: { product: true } } } as any
        });

        if (!stocktake) return NextResponse.json({ error: 'Stocktake not found' }, { status: 404 });
        if (stocktake.status === 'approved') return NextResponse.json({ error: 'Already approved' }, { status: 400 });

        const tenantId = req.headers.get('x-tenant') || 'default';
        const ipAddress = req.headers.get('x-forwarded-for') || null;

        // Resolve active user context from the incoming JWT session
        // استخراج سياق المستخدم الفعال من رمز المصادقة للتأكد من هويته وصلاحياته
        const auth = getUserFromRequest(req as any);

        // Build the full override context for soft period locks
        // بناء سياق التجاوز الكامل للتحقق مما إذا كان للمستخدم تصريح بتجاوز الأقفال المؤقتة
        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const overrideContext = buildOverrideContextFromRequest(req as any, {
            tenantId,
            actorId: String(auth?.userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        // Resolve stocktake date safely as a Date object from the database record
        // استخراج تاريخ الجرد بشكل آمن وتحويله لكائن تاريخ للتحقق من الأقفال المحاسبية
        const postingDate = new Date((stocktake as any).stocktakeDate || (stocktake as any).date || new Date());

        // ── Period Lock Enforcement (بوابة فحص أقفال الفترات المحاسبية) ──
        // Validate against modular locks ('inventory') based on stocktake date to protect costing layers.
        // التحقق من أقفال الفروع والمستودعات بناءً على تاريخ الجرد لحماية عمليات التسعير والقيود المحاسبية.
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate,
                operationType: 'STOCKTAKE_APPROVE',
                module: 'inventory',
                actor: String(auth?.userId || 'SYSTEM'),
                overrideContext
            });
        } catch (err) {
            if (err instanceof PeriodLockViolation) {
                log.warn(`Stocktake approval blocked by period lock: ${err.message}`, { id, tenantId });
                return NextResponse.json({
                    error: err.message,
                    code: err.code
                }, { status: err.code === 'LOCKED' ? 409 : 422 });
            }
            throw err;
        }
        // ────────────────────────────────────────────────────────────────────

        // Use the strongly typed wrapper to apply the stocktake variances atomically
        // تطبيق فروقات الجرد بشكل ذري متكامل لضمان صحة الأرصدة والقيود المحاسبية
        await runInventoryTx(prisma, async (tx) => {
            await InventoryAdjustmentService.approveStocktake(tx, stocktake, tenantId, ipAddress);
        }, `approve-stocktake-${id}`);

        return NextResponse.json({ success: true, message: 'Stocktake approved and stock updated' });
    } catch (e: any) {
        log.error(`Failed to approve stocktake ${params}: ${e.message}`, e);
        return NextResponse.json({ error: e.message }, { status: e.message === 'Already approved' ? 400 : 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
