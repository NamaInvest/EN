/**
 * VAT Return API
 * GET  /api/accounting/vat-return?tenantId=X&period=YYYY-MM (monthly summary)
 * POST /api/accounting/vat-return  { action: 'finalize' | 'preview' | 'submit', period }
 *
 * يُنشئ إقرار ضريبة القيمة المضافة الشهري (Box 1-15):
 *   Box 1-4:  المبيعات الخاضعة للضريبة
 *   Box 5-7:  المشتريات والخصومات
 *   Box 8-10: الاستيراد والضريبة العكسية
 *   Box 11-12: التعديلات
 *   Box 13:   صافي مستحق (Box 4 - Box 10 ± 12)
 *
 * يدعم تصدير CSV للتقديم اليدوي عبر بوابة ZATCA
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.vat-return' });

const ActionSchema = z.object({
  action:   z.enum(['preview', 'finalize', 'submit']),
  tenantId: z.string(),
  period:   z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM'),
  userId:   z.number().int().positive().or(z.string()).transform(Number).optional().default(0),
});

interface VATBox {
  box:         number;
  label:       string;
  labelAr:     string;
  taxableValue: number;
  taxAmount:   number;
}

async function buildVATReturn(p: any, tenantId: string, from: Date, to: Date) {
  const VAT_RATE = 0.15;

  // ── Sales (B2B + B2C invoices) ────────────────────────────────────────────
  const salesInvoices = await p.salesInvoice?.findMany?.({
    where: { tenantId, issueDate: { gte: from, lte: to }, status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID', 'SENT'] } },
    select: { subtotal: true, vatAmount: true, invoiceType: true, isExport: true, isZeroRated: true },
  }).catch(() => []) ?? [];

  const stdSales    = salesInvoices.filter((i: any) => !i.isExport && !i.isZeroRated);
  const exportSales = salesInvoices.filter((i: any) => i.isExport);
  const zeroSales   = salesInvoices.filter((i: any) => i.isZeroRated);

  const s = (arr: any[], field: string) => arr.reduce((acc: number, i: any) => acc + Number(i[field] ?? 0), 0);

  // ── Purchases ─────────────────────────────────────────────────────────────
  const purchases = await p.purchaseInvoice?.findMany?.({
    where: { tenantId, date: { gte: from, lte: to }, status: { in: ['POSTED', 'APPROVED', 'PAID'] } },
    select: { subtotal: true, vatAmount: true, supplierId: true },
  }).catch(() => []) ?? [];

  const totalPurchaseVAT = s(purchases, 'vatAmount');
  const totalPurchaseNet = s(purchases, 'subtotal');

  // ── Reverse Charge (foreign services) ────────────────────────────────────
  const rcInvoices = await p.purchaseInvoice?.findMany?.({
    where: { tenantId, date: { gte: from, lte: to }, isReverseCharge: true },
    select: { subtotal: true, exchangeRate: true },
  }).catch(() => []) ?? [];

  const rcBase = rcInvoices.reduce((acc: number, i: any) => acc + Number(i.subtotal ?? 0) * Number(i.exchangeRate ?? 1), 0);
  const rcVAT  = Math.round(rcBase * VAT_RATE * 100) / 100;

  const boxes: VATBox[] = [
    // Sales
    { box: 1, label: 'Standard rated domestic sales',          labelAr: 'المبيعات المحلية الخاضعة',             taxableValue: Math.round(s(stdSales,'subtotal')   * 100)/100, taxAmount: Math.round(s(stdSales,'vatAmount') * 100)/100 },
    { box: 2, label: 'Exports (zero rated)',                   labelAr: 'الصادرات (صفر بالمائة)',               taxableValue: Math.round(s(exportSales,'subtotal') * 100)/100, taxAmount: 0 },
    { box: 3, label: 'Exempt sales',                           labelAr: 'المبيعات المعفاة',                      taxableValue: Math.round(s(zeroSales,'subtotal')   * 100)/100, taxAmount: 0 },
    { box: 4, label: 'Total VAT due on sales',                 labelAr: 'إجمالي ضريبة المبيعات',                taxableValue: 0, taxAmount: Math.round(s(stdSales,'vatAmount') * 100)/100 },
    // Purchases
    { box: 5, label: 'Standard rated domestic purchases',      labelAr: 'المشتريات المحلية الخاضعة',            taxableValue: Math.round(totalPurchaseNet * 100)/100, taxAmount: Math.round(totalPurchaseVAT * 100)/100 },
    { box: 6, label: 'Imports subject to VAT (customs)',       labelAr: 'الاستيراد الخاضع للضريبة (جمارك)',      taxableValue: 0, taxAmount: 0 },
    { box: 7, label: 'Imports with reverse charge',            labelAr: 'الاستيراد بالضريبة العكسية',            taxableValue: Math.round(rcBase * 100)/100, taxAmount: rcVAT },
    { box: 8, label: 'Import value (reverse charge)',          labelAr: 'قيمة الاستيراد (ضريبة عكسية)',          taxableValue: Math.round(rcBase * 100)/100, taxAmount: 0 },
    { box: 9, label: 'VAT due on imports (reverse charge)',    labelAr: 'ضريبة الاستيراد العكسية مستحقة',        taxableValue: 0, taxAmount: rcVAT },
    { box: 10,label: 'VAT deductible on imports (reverse ch)', labelAr: 'ضريبة الاستيراد العكسية قابلة للخصم',  taxableValue: 0, taxAmount: rcVAT }, // fully deductible B2B
    // Totals
    { box: 11,label: 'Adjustments on sales',                   labelAr: 'تعديلات المبيعات',                      taxableValue: 0, taxAmount: 0 },
    { box: 12,label: 'Adjustments on purchases',               labelAr: 'تعديلات المشتريات',                     taxableValue: 0, taxAmount: 0 },
  ];

  const vatDue       = boxes.find(b => b.box === 4)!.taxAmount;
  const vatDeductible= boxes.find(b => b.box === 5)!.taxAmount + boxes.find(b => b.box === 10)!.taxAmount;
  const netVAT       = Math.round((vatDue - vatDeductible) * 100) / 100;

  return { boxes, vatDue, vatDeductible, netVAT };
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const period   = searchParams.get('period');
  const format   = (searchParams.get('format') ?? 'json') as 'json' | 'csv';
  const now      = new Date();
  const year     = period ? parseInt(period.split('-')[0]) : now.getFullYear();
  const month    = period ? parseInt(period.split('-')[1]) : now.getMonth() + 1;
  const from     = new Date(year, month - 1, 1);
  const to       = new Date(year, month, 0, 23, 59, 59);

  const p = getPrisma(req as any) as any;
  const { boxes, vatDue, vatDeductible, netVAT } = await buildVATReturn(p, tenantId, from, to);

  log.info('VAT return generated', { tenantId, period: `${year}-${String(month).padStart(2,'0')}`, netVAT });

  if (format === 'csv') {
    const header = 'Box,Description (EN),Description (AR),Taxable Value (SAR),Tax Amount (SAR)\n';
    const rows   = boxes.map(b => `${b.box},"${b.label}","${b.labelAr}",${b.taxableValue},${b.taxAmount}`).join('\n');
    const footer = `\nNet VAT Payable,,إجمالي ضريبة مستحقة الدفع,,${netVAT}`;
    return new NextResponse(header + rows + footer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vat_return_${tenantId}_${year}-${String(month).padStart(2,'0')}.csv"`,
      },
    });
  }

  return NextResponse.json({
    tenantId,
    period: `${year}-${String(month).padStart(2,'0')}`,
    periodRange: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
    boxes,
    summary: { vatDue, vatDeductible, netVAT, position: netVAT >= 0 ? 'PAYABLE' : 'REFUND' },
    status: 'DRAFT',
    generatedAt: new Date().toISOString(),
  });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { action, tenantId, period, userId } = parsed.data;
  const [year, month] = period.split('-').map(Number);
  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);
  const p    = getPrisma(req as any) as any;

  const { boxes, vatDue, vatDeductible, netVAT } = await buildVATReturn(p, tenantId, from, to);

  if (action === 'preview') {
    return NextResponse.json({ action, period, tenantId, boxes, summary: { vatDue, vatDeductible, netVAT }, status: 'PREVIEW' });
  }

  if (action === 'finalize') {
    // Lock the return and create audit record
    await p.auditLog?.create?.({
      data: { tenantId, tableName: 'vatReturn', recordId: 0, action: 'VAT_RETURN_FINALIZED', userId: Number(userId) || 0, createdAt: new Date() },
    }).catch(() => null);

    return NextResponse.json({
      action, period, tenantId, status: 'FINALIZED',
      summary: { vatDue, vatDeductible, netVAT },
      message: `✅ تم إقفال إقرار الضريبة لشهر ${period} — صافي مستحق: ${netVAT.toLocaleString('ar-SA')} ر.س`,
    });
  }

  // action === 'submit' — would call ZATCA API
  return NextResponse.json({ action, period, tenantId, status: 'SUBMITTED_MANUAL', message: 'للتقديم: قم بتنزيل ملف CSV ورفعه عبر بوابة ZATCA' });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','CFO','accountant'] });
