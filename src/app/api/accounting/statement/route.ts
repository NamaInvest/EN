/**
 * Customer / Supplier Account Statement API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/accounting/statement?type=customer&entityId=X&tenantId=Y&from=&to=
 * GET /api/accounting/statement?type=supplier&entityId=X&tenantId=Y
 *
 * يُولِّد كشف حساب مفصّل يشمل:
 *   - رصيد افتتاحي
 *   - جميع الفواتير والمدفوعات والإشعارات
 *   - رصيد جاري متراكم (Running Balance)
 *   - تحليل التقادم الزمني (Aging Summary)
 *   - إجماليات مدين / دائن
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.statement' });

interface StatementLine {
  date:        string;
  reference:   string;
  type:        string;
  description: string;
  debit:       number;
  credit:      number;
  balance:     number;
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type     = (searchParams.get('type') ?? 'customer').toLowerCase() as 'customer' | 'supplier';
  const entityId = parseInt(searchParams.get('entityId') ?? '0');
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const fromStr  = searchParams.get('from');
  const toStr    = searchParams.get('to');
  const currency = searchParams.get('currency') ?? 'SAR';

  if (!entityId) {
    return NextResponse.json({ error: 'entityId مطلوب' }, { status: 400 });
  }

  const now  = new Date();
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), 0, 1);
  const to   = toStr   ? new Date(toStr + 'T23:59:59') : now;

  const p = getPrisma(req as any) as any;

  // ── Fetch entity ───────────────────────────────────────────────────────────
  const entityModel = type === 'customer' ? 'customer' : 'supplier';
  const entity = await p[entityModel]?.findUnique?.({
    where: { id: entityId },
    select: {
      id: true, name: true, nameEn: true,
      code: true, vatNumber: true, phone: true, email: true,
    },
  }).catch(() => null);

  if (!entity) {
    return NextResponse.json({ error: `${type} ${entityId} not found` }, { status: 404 });
  }

  // ── Opening balance (transactions BEFORE from date) ─────────────────────
  const invoiceModel  = type === 'customer' ? 'salesInvoice'    : 'purchaseInvoice';
  const paymentModel  = type === 'customer' ? 'salesPayment'    : 'supplierPayment';
  const fkField       = type === 'customer' ? 'customerId'      : 'supplierId';

  const [openingInvoices, openingPayments] = await Promise.all([
    p[invoiceModel]?.aggregate?.({
      _sum: { total: true },
      where: { tenantId, [fkField]: entityId, date: { lt: from }, status: { not: 'CANCELLED' } },
    }).catch(() => null),
    p[paymentModel]?.aggregate?.({
      _sum: { amount: true },
      where: { tenantId, [fkField]: entityId, date: { lt: from } },
    }).catch(() => null),
  ]);

  const openingDebit  = type === 'customer' ? Number(openingInvoices?._sum?.total ?? 0) : Number(openingPayments?._sum?.amount ?? 0);
  const openingCredit = type === 'customer' ? Number(openingPayments?._sum?.amount ?? 0) : Number(openingInvoices?._sum?.total ?? 0);
  const openingBalance = openingDebit - openingCredit;

  // ── Period transactions ─────────────────────────────────────────────────
  const [invoices, payments, creditNotes] = await Promise.all([
    p[invoiceModel]?.findMany?.({
      where: { tenantId, [fkField]: entityId, date: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      orderBy: { date: 'asc' },
      select: {
        id: true, date: true, invoiceNo: true,
        total: true, paidAmount: true, remainingAmount: true,
        status: true, dueDate: true, description: true,
      },
    }).catch(() => []) ?? [],

    p[paymentModel]?.findMany?.({
      where: { tenantId, [fkField]: entityId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, reference: true, amount: true, method: true, notes: true },
    }).catch(() => []) ?? [],

    p.creditNote?.findMany?.({
      where: { tenantId, [fkField]: entityId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, reference: true, amount: true, reason: true },
    }).catch(() => []) ?? [],
  ]);

  // ── Build statement lines ────────────────────────────────────────────────
  const rawLines: { date: Date; line: Omit<StatementLine, 'balance'> }[] = [];

  for (const inv of invoices) {
    const isCustomer = type === 'customer';
    rawLines.push({
      date: new Date(inv.date),
      line: {
        date:        new Date(inv.date).toISOString().split('T')[0],
        reference:   `INV-${inv.invoiceNo ?? inv.id}`,
        type:        'INVOICE',
        description: inv.description ?? (isCustomer ? 'فاتورة مبيعات' : 'فاتورة مشتريات'),
        debit:       isCustomer ? Number(inv.total ?? 0) : 0,
        credit:      isCustomer ? 0 : Number(inv.total ?? 0),
      },
    });
  }

  for (const pay of payments) {
    const isCustomer = type === 'customer';
    rawLines.push({
      date: new Date(pay.date),
      line: {
        date:        new Date(pay.date).toISOString().split('T')[0],
        reference:   pay.reference ?? `PAY-${pay.id}`,
        type:        'PAYMENT',
        description: pay.notes ?? (isCustomer ? 'سداد من عميل' : 'دفعة لمورد'),
        debit:       isCustomer ? 0 : Number(pay.amount ?? 0),
        credit:      isCustomer ? Number(pay.amount ?? 0) : 0,
      },
    });
  }

  for (const cn of creditNotes) {
    const isCustomer = type === 'customer';
    rawLines.push({
      date: new Date(cn.date),
      line: {
        date:        new Date(cn.date).toISOString().split('T')[0],
        reference:   cn.reference ?? `CN-${cn.id}`,
        type:        'CREDIT_NOTE',
        description: cn.reason ?? 'إشعار دائن',
        debit:       isCustomer ? 0 : Number(cn.amount ?? 0),
        credit:      isCustomer ? Number(cn.amount ?? 0) : 0,
      },
    });
  }

  // Sort by date then build running balance
  rawLines.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = openingBalance;
  const lines: StatementLine[] = rawLines.map(({ line }) => {
    runningBalance += line.debit - line.credit;
    return {
      ...line,
      debit:   Math.round(line.debit  * 100) / 100,
      credit:  Math.round(line.credit * 100) / 100,
      balance: Math.round(runningBalance * 100) / 100,
    };
  });

  const totalDebit  = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const closingBalance = openingBalance + totalDebit - totalCredit;

  // ── Aging on closing balance ─────────────────────────────────────────────
  const overdueDays: { days: number; amount: number }[] = invoices
    .filter((inv: any) => Number(inv.remainingAmount ?? 0) > 0 && inv.dueDate)
    .map((inv: any) => {
      const due  = new Date(inv.dueDate);
      const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return { days, amount: Number(inv.remainingAmount ?? 0) };
    });

  const aging = {
    current:   overdueDays.filter(r => r.days <= 0).reduce((s, r) => s + r.amount, 0),
    days1_30:  overdueDays.filter(r => r.days >= 1  && r.days <= 30).reduce((s, r) => s + r.amount, 0),
    days31_60: overdueDays.filter(r => r.days >= 31 && r.days <= 60).reduce((s, r) => s + r.amount, 0),
    days61_90: overdueDays.filter(r => r.days >= 61 && r.days <= 90).reduce((s, r) => s + r.amount, 0),
    over90:    overdueDays.filter(r => r.days > 90).reduce((s, r) => s + r.amount, 0),
  };

  log.info('Statement generated', { type, entityId, tenantId, lines: lines.length, closing: Math.round(closingBalance) });

  return NextResponse.json({
    type,
    tenantId,
    currency,
    period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
    entity: {
      id:         entity.id,
      name:       entity.name,
      code:       entity.code,
      vatNumber:  entity.vatNumber,
      phone:      entity.phone,
      email:      entity.email,
    },
    openingBalance:  Math.round(openingBalance  * 100) / 100,
    totalDebit:      Math.round(totalDebit       * 100) / 100,
    totalCredit:     Math.round(totalCredit      * 100) / 100,
    closingBalance:  Math.round(closingBalance   * 100) / 100,
    lines,
    aging: Object.fromEntries(Object.entries(aging).map(([k, v]) => [k, Math.round((v as number) * 100) / 100])),
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
