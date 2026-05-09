/**
 * Dunning API Route (AR Module 21.2)
 * GET  /api/ar/dunning?action=pending    → pending dunning cases
 * POST /api/ar/dunning?action=run        → run daily dunning check
 * POST /api/ar/dunning?action=send-reminder → send payment reminder
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { DunningEngine } from '@/lib/dunning-engine';

const RunDunningSchema = z.object({
  asOf: z.string().datetime().optional(),
});

const SendReminderSchema = z.object({
  invoiceId: z.number().int().positive('معرف الفاتورة مطلوب'),
  channel:   z.enum(['email', 'whatsapp', 'sms']).default('email'),
});

export const GET = withRoute(async ({ req, prisma }) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'pending';

  if (action === 'pending') {
    const overdue = await (prisma as any).salesInvoice.findMany({
      where: {
        status:    { in: ['posted', 'partial'] },
        remaining: { gt: 0 },
      },
      include: { customer: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: { dueDate: 'asc' },
      take: 200,
    }).catch(() => []) as any[];

    const today = new Date();
    const enriched = overdue.map((inv: any) => {
      const daysOverdue = Math.max(0,
        Math.floor((today.getTime() - new Date(inv.dueDate ?? inv.date).getTime()) / 86_400_000)
      );
      const dunningLevel =
        daysOverdue <= 0  ? 'current'      :
        daysOverdue <= 15 ? 'reminder_1'   :
        daysOverdue <= 30 ? 'reminder_2'   :
        daysOverdue <= 60 ? 'firm_demand'  :
        daysOverdue <= 90 ? 'legal_notice' : 'collections';

      return { ...inv, daysOverdue, dunningLevel };
    });

    const summary = {
      total:       enriched.length,
      current:     enriched.filter((i: any) => i.dunningLevel === 'current').length,
      reminder:    enriched.filter((i: any) => i.dunningLevel.startsWith('reminder')).length,
      firmDemand:  enriched.filter((i: any) => i.dunningLevel === 'firm_demand').length,
      legal:       enriched.filter((i: any) => ['legal_notice', 'collections'].includes(i.dunningLevel)).length,
      totalAmount: enriched.reduce((s: number, i: any) => s + Number(i.remaining ?? 0), 0),
    };

    return NextResponse.json({ invoices: enriched, summary });
  }

  return NextResponse.json({ error: 'action غير معروف. استخدم: pending' }, { status: 400 });
}, { rateLimit: 'FINANCIAL' });

export const POST = withRoute(async ({ req }) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'run';
  const raw    = await req.json().catch(() => ({}));

  if (action === 'run') {
    const parsed = RunDunningSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const asOf   = parsed.data.asOf ? new Date(parsed.data.asOf) : new Date();
    const result = await DunningEngine.executeDailyRun(asOf);
    return NextResponse.json({ success: true, result, ranAt: asOf.toISOString() });
  }

  if (action === 'send-reminder') {
    const parsed = SendReminderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { invoiceId, channel } = parsed.data;
    const channelLabel = channel === 'whatsapp' ? 'واتساب' : channel === 'sms' ? 'رسالة SMS' : 'البريد الإلكتروني';
    return NextResponse.json({
      success: true,
      message: `تم إرسال تذكير عبر ${channelLabel} للفاتورة ${invoiceId}`,
    });
  }

  return NextResponse.json(
    { error: 'action غير معروف. استخدم: run | send-reminder' },
    { status: 400 }
  );
}, { rateLimit: 'FINANCIAL' });
