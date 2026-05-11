/**
 * Collection Workflow API
 * GET  /api/accounting/collection-workflow?tenantId=X  (summary + active invoices)
 * POST /api/accounting/collection-workflow  (record activity, promise-to-pay, escalate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { CollectionWorkflowEngine } from '@/lib/collection-workflow-engine';
import type { PrismaClient } from '@prisma/client';

const ActionSchema = z.object({
  action:      z.enum(['CALL','EMAIL','VISIT','LEGAL_NOTICE','WRITE_OFF','PROMISE','PAYMENT_RECEIVED','ESCALATE_BROKEN']),
  tenantId:    z.string(),
  invoiceId:   z.number().int().positive().optional(),
  userId:      z.number().int().positive().or(z.string()).transform(Number).optional().default(0),
  notes:       z.string().optional(),
  amount:      z.number().positive().optional(),
  promiseDate: z.string().optional(),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId   = searchParams.get('tenantId') ?? 'default';
  const invoiceId  = searchParams.get('invoiceId') ? parseInt(searchParams.get('invoiceId')!) : null;
  const prismaClient = getPrisma(req as any) as unknown as PrismaClient;
  const engine = new CollectionWorkflowEngine(prismaClient);

  if (invoiceId) {
    const p   = prismaClient as any;
    const status = await engine.getStatus(tenantId, invoiceId);
    const activities = await p.collectionActivity?.findMany?.({
      where: { tenantId, invoiceId },
      orderBy: { performedAt: 'desc' },
      take: 50,
    }).catch(() => []) ?? [];
    return NextResponse.json({ tenantId, invoiceId, status, activities });
  }

  const summary = await engine.getSummary(tenantId);
  const p = prismaClient as any;

  const urgentInvoices = await p.salesInvoice?.findMany?.({
    where: {
      tenantId,
      remainingAmount: { gt: 0 },
      status:          { in: ['SENT','OVERDUE','PARTIALLY_PAID'] },
      dueDate:         { lt: new Date() },
    },
    orderBy: { remainingAmount: 'desc' },
    take: 50,
    include: {
      customer: { select: { id: true, name: true, nameAr: true, phone: true } },
    },
  }).catch(() => []) ?? [];

  return NextResponse.json({
    tenantId,
    summary,
    urgentInvoices: urgentInvoices.map((inv: any) => ({
      id:              inv.id,
      invoiceNo:       inv.invoiceNo,
      customerName:    inv.customer?.nameAr ?? inv.customer?.name,
      customerPhone:   inv.customer?.phone,
      remainingAmount: Math.round(Number(inv.remainingAmount ?? 0) * 100) / 100,
      dueDate:         inv.dueDate,
      daysPastDue:     Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000*60*60*24)),
      collectionStatus:inv.collectionStatus ?? 'NEW',
      dunningLevel:    inv.dunningLevel ?? 0,
    })),
    generatedAt: new Date().toISOString(),
  });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { action, tenantId, invoiceId, userId, notes, amount, promiseDate } = parsed.data;
  const prismaClient = getPrisma(req as any) as unknown as PrismaClient;
  const engine = new CollectionWorkflowEngine(prismaClient);

  if (action === 'ESCALATE_BROKEN') {
    const result = await engine.escalateBrokenPromises(tenantId);
    return NextResponse.json({ ...result, message: `✅ تم تصعيد ${result.escalated} فاتورة` });
  }

  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId مطلوب' }, { status: 400 });
  }

  if (action === 'PROMISE') {
    if (!promiseDate || !amount) return NextResponse.json({ error: 'promiseDate و amount مطلوبان' }, { status: 400 });
    await engine.recordPromise(tenantId, {
      invoiceId,
      promiseDate:   new Date(promiseDate),
      promiseAmount: amount,
      notes,
    }, Number(userId));
    return NextResponse.json({ success: true, message: `✅ تم تسجيل وعد الدفع — ${amount.toLocaleString('ar-SA')} ر.س بتاريخ ${promiseDate}` });
  }

  await engine.recordActivity({ invoiceId, tenantId, userId: Number(userId), action: action as any, notes, amount });
  return NextResponse.json({ success: true, message: `✅ تم تسجيل النشاط: ${action}` });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', roles: ['admin','accountant','sales','CFO','collection'] });
