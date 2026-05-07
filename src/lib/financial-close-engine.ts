/**
 * Financial Close Checklist Engine
 */
import type { PrismaClient } from '@prisma/client';
const p = (prisma: PrismaClient) => prisma as any;

const DEFAULT_ITEMS = [
    { order: 1, titleAr: 'تسوية البنوك', titleEn: 'Bank Reconciliation', category: 'BANK' },
    { order: 2, titleAr: 'مراجعة الذمم المدينة', titleEn: 'Review AR Aging', category: 'AR' },
    { order: 3, titleAr: 'مراجعة الذمم الدائنة', titleEn: 'Review AP Aging', category: 'AP' },
    { order: 4, titleAr: 'ترحيل الاستهلاك', titleEn: 'Post Depreciation', category: 'ASSETS' },
    { order: 5, titleAr: 'ترحيل الإيرادات المؤجلة', titleEn: 'Post Deferred Revenue', category: 'DEFERRED' },
    { order: 6, titleAr: 'مراجعة قيود التعديل', titleEn: 'Review Adjusting Entries', category: 'GL' },
    { order: 7, titleAr: 'تسوية العملات الأجنبية', titleEn: 'FX Revaluation', category: 'FX' },
    { order: 8, titleAr: 'مراجعة المخصصات', titleEn: 'Review Provisions', category: 'GL' },
    { order: 9, titleAr: 'طباعة ميزان المراجعة', titleEn: 'Print Trial Balance', category: 'REPORTS' },
    { order: 10, titleAr: 'مراجعة الميزانية العمومية', titleEn: 'Review Balance Sheet', category: 'REPORTS' },
    { order: 11, titleAr: 'مراجعة قائمة الدخل', titleEn: 'Review Income Statement', category: 'REPORTS' },
    { order: 12, titleAr: 'إقفال الفترة', titleEn: 'Close Period', category: 'CLOSE' },
];

export class FinancialCloseEngine {
    static async getChecklist(prisma: PrismaClient, tenantId: string, period: string) {
        const existing = await p(prisma).closeChecklist?.findMany?.({ where: { tenantId, period } }) || [];
        if (existing.length > 0) return existing;
        return DEFAULT_ITEMS.map((item, i) => ({ id: i + 1, ...item, period, completed: false, completedBy: null, completedAt: null, notes: '' }));
    }
    static async toggleItem(prisma: PrismaClient, data: { tenantId: string; period: string; itemOrder: number; completed: boolean; userId: number }) {
        const existing = await p(prisma).closeChecklist?.findFirst?.({ where: { tenantId: data.tenantId, period: data.period, order: data.itemOrder } });
        if (existing) {
            return p(prisma).closeChecklist?.update?.({ where: { id: existing.id }, data: { completed: data.completed, completedBy: data.completed ? data.userId : null, completedAt: data.completed ? new Date() : null } });
        }
        return p(prisma).closeChecklist?.create?.({ data: { tenantId: data.tenantId, period: data.period, order: data.itemOrder, completed: data.completed, completedBy: data.completed ? data.userId : null, completedAt: data.completed ? new Date() : null } });
    }
    static async getProgress(prisma: PrismaClient, tenantId: string, period: string) {
        const items = await this.getChecklist(prisma, tenantId, period);
        const total = items.length;
        const done = items.filter((i: any) => i.completed).length;
        return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
    }
}
