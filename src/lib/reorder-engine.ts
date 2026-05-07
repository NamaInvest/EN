/**
 * Reorder Rules Engine — auto-generate POs when stock falls below min
 */
import type { PrismaClient } from '@prisma/client';
const p = (prisma: PrismaClient) => prisma as any;

export class ReorderEngine {
    static async getRules(prisma: PrismaClient, tenantId?: string) {
        const where = tenantId ? { tenantId, isActive: true } : { isActive: true };
        return p(prisma).reorderRule?.findMany?.({ where }) || [];
    }
    static async createRule(prisma: PrismaClient, data: any) {
        return p(prisma).reorderRule?.create?.({ data: { ...data, isActive: true } }) || { id: Date.now(), ...data };
    }
    static async evaluate(prisma: PrismaClient) {
        const rules = await this.getRules(prisma);
        const alerts: any[] = [];
        for (const rule of rules) {
            try {
                const product = await p(prisma).product?.findUnique?.({ where: { id: rule.productId }, select: { id: true, name: true, quantity: true } });
                if (product && (product.quantity || 0) < (rule.minQty || 0)) {
                    const orderQty = (rule.maxQty || rule.reorderQty || rule.minQty * 2) - (product.quantity || 0);
                    alerts.push({ ruleId: rule.id, productId: product.id, productName: product.name, currentQty: product.quantity || 0, minQty: rule.minQty, orderQty: Math.max(orderQty, rule.reorderQty || 1), supplierId: rule.supplierId });
                }
            } catch {}
        }
        return alerts;
    }
    static async autoCreatePOs(prisma: PrismaClient) {
        const alerts = await this.evaluate(prisma);
        const bySupplier: Record<number, any[]> = {};
        for (const a of alerts) { if (a.supplierId) { if (!bySupplier[a.supplierId]) bySupplier[a.supplierId] = []; bySupplier[a.supplierId].push(a); } }
        return { alertCount: alerts.length, groupedBySupplier: Object.keys(bySupplier).length, alerts };
    }
}
