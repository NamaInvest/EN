/**
 * VAT Classifier Engine (Build #9)
 * ═════════════════════════════════
 * 
 * تصنيف ضريبي دقيق لكل سطر فاتورة حسب ZATCA Phase 2.
 * يدعم: 15% (Standard) | 0% (Zero-rated) | معفى (Exempt) | عكس التحميل (Reverse Charge)
 * 
 * ZATCA codes: VATEX-SA-29 (medical), VATEX-SA-32 (financial), VATEX-SA-29-7 (real-estate)
 */

import type { PrismaClient } from '@prisma/client';

const db = (p: any) => p as any;

// ── Default VAT Categories ──────────────────────────────────────
export const DEFAULT_VAT_CATEGORIES = [
    { code: 'S',  nameAr: 'خاضعة',            nameEn: 'Standard Rate',     rate: 0.15,  zatcaCode: 'S',  exemptionReasonRequired: false },
    { code: 'Z',  nameAr: 'صفرية',             nameEn: 'Zero Rated',        rate: 0.00,  zatcaCode: 'Z',  exemptionReasonRequired: false },
    { code: 'E',  nameAr: 'معفاة',             nameEn: 'Exempt',            rate: 0.00,  zatcaCode: 'E',  exemptionReasonRequired: true },
    { code: 'O',  nameAr: 'خارج النطاق',       nameEn: 'Out of Scope',      rate: 0.00,  zatcaCode: 'O',  exemptionReasonRequired: false },
    { code: 'RC', nameAr: 'عكس التحميل',        nameEn: 'Reverse Charge',    rate: 0.15,  zatcaCode: 'S',  exemptionReasonRequired: false },
];

// ── Seed VAT Categories ─────────────────────────────────────────
export async function seedVatCategories(prisma: PrismaClient): Promise<number> {
    let created = 0;
    for (const cat of DEFAULT_VAT_CATEGORIES) {
        try {
            await db(prisma).vatCategory.upsert({
                where: { code: cat.code },
                update: {},
                create: cat,
            });
            created++;
        } catch { /* skip */ }
    }
    return created;
}

// ── Classify Line ───────────────────────────────────────────────
/**
 * يحدد تصنيف ضريبي لسطر فاتورة بناءً على:
 * - نوع المنتج (طبي، مالي، عقاري)
 * - بلد العميل (تصدير = Zero-rated)
 * - نوع المورد (أجنبي = Reverse Charge)
 */
export function classifyLine(params: {
    productCategory?: string;
    customerCountry?: string;
    vendorCountry?: string;
    isExport?: boolean;
    isServiceFromAbroad?: boolean;
}): { categoryCode: string; exemptionReason?: string } {
    // Exports → Zero rated
    if (params.isExport || (params.customerCountry && params.customerCountry !== 'SA')) {
        return { categoryCode: 'Z' };
    }

    // Foreign vendor of services → Reverse Charge (buyer self-assesses)
    if (params.isServiceFromAbroad || (params.vendorCountry && params.vendorCountry !== 'SA')) {
        return { categoryCode: 'RC' };
    }

    // Medical/healthcare products
    if (params.productCategory === 'MEDICAL' || params.productCategory === 'HEALTHCARE') {
        return { categoryCode: 'E', exemptionReason: 'VATEX-SA-29' };
    }

    // Financial services
    if (params.productCategory === 'FINANCIAL_SERVICE') {
        return { categoryCode: 'E', exemptionReason: 'VATEX-SA-32' };
    }

    // Real estate rental
    if (params.productCategory === 'REAL_ESTATE_RENTAL') {
        return { categoryCode: 'E', exemptionReason: 'VATEX-SA-29-7' };
    }

    // Default: Standard 15%
    return { categoryCode: 'S' };
}

// ── Compute VAT Per Category for Period ──────────────────────────
export async function computeVatPerCategory(
    prisma: PrismaClient,
    periodStart: string,
    periodEnd: string
): Promise<{
    categories: Array<{
        code: string;
        name: string;
        totalSales: number;
        totalPurchases: number;
        vatCollected: number;
        vatPaid: number;
        netVat: number;
    }>;
    totalVatDue: number;
}> {
    // Fetch VAT categories
    const categories = await db(prisma).vatCategory.findMany({ where: { isActive: true } });

    // For now, return structure with zeros — real implementation would
    // aggregate from SalesInvoiceDetail + PurchaseInvoiceDetail
    const result = categories.map((cat: any) => ({
        code: cat.code,
        name: cat.nameAr,
        totalSales: 0,
        totalPurchases: 0,
        vatCollected: 0,
        vatPaid: 0,
        netVat: 0,
    }));

    return {
        categories: result,
        totalVatDue: result.reduce((sum: number, c: any) => sum + c.netVat, 0),
    };
}

// ── Build VAT Return ────────────────────────────────────────────
export async function buildVatReturn(
    prisma: PrismaClient,
    periodStart: string,
    periodEnd: string
): Promise<{
    period: { from: string; to: string };
    sections: Record<string, any>;
    totalVatDue: number;
    status: string;
}> {
    const vatData = await computeVatPerCategory(prisma, periodStart, periodEnd);

    return {
        period: { from: periodStart, to: periodEnd },
        sections: {
            standardRated: vatData.categories.find((c: any) => c.code === 'S') || null,
            zeroRated: vatData.categories.find((c: any) => c.code === 'Z') || null,
            exempt: vatData.categories.find((c: any) => c.code === 'E') || null,
            reverseCharge: vatData.categories.find((c: any) => c.code === 'RC') || null,
        },
        totalVatDue: vatData.totalVatDue,
        status: 'DRAFT',
    };
}

// ── Get All VAT Categories ──────────────────────────────────────
export async function getVatCategories(prisma: PrismaClient): Promise<any[]> {
    return db(prisma).vatCategory.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
    });
}
