/**
 * VAT Return Reminder Cron
 * POST /api/cron/vat-return-reminder
 * Schedule: 0 8 20 * *  (day 20 of each month at 8 AM)
 *
 * يُذكِّر الفريق المالي بضرورة تقديم إقرار ضريبة القيمة المضافة
 * قبل الموعد النهائي (اليوم الأخير من الشهر التالي)
 *
 * يُرسل:
 *   1. Telegram: ملخص الإقرار + المبلغ المقدّر + deadline
 *   2. إنشاء مهمة تذكير في Notification table
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTenant } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log  = logger.child({ service: 'cron.vat-reminder' });
const CRON = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? req.headers.get('x-cron-secret');
  if (auth !== CRON && auth !== `Bearer ${CRON}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now     = new Date();
  // Remind for CURRENT month VAT return (due end of next month)
  const year    = now.getFullYear();
  const month   = now.getMonth() + 1;
  const period  = `${year}-${String(month).padStart(2, '0')}`;

  // Deadline = last day of next month
  const nextMonth  = new Date(year, month, 1); // 1st of next month
  const deadline   = new Date(year, month + 1, 0); // last day of next month
  const daysLeft   = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const p = prisma as any;
  const tenants = await p.tenant?.findMany?.({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
  }).catch(() => []) ?? [{ id: 'default', code: 'DEFAULT', name: 'Default' }];

  const results: { tenantId: string; estimatedVAT: number; notified: boolean }[] = [];

  for (const tenant of tenants) {
    const tenantId = String(tenant.id ?? tenant.code);

    await withTenant(tenantId, async () => {
      // Quick VAT estimate from current month invoices
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd   = new Date(year, month, 0, 23, 59, 59);

      const salesAgg = await p.salesInvoice?.aggregate?.({
        _sum: { vatAmount: true, subtotal: true },
        where: { tenantId, issueDate: { gte: monthStart, lte: monthEnd }, status: { in: ['POSTED','SENT','PAID'] } },
      }).catch(() => null);

      const purchAgg = await p.purchaseInvoice?.aggregate?.({
        _sum: { vatAmount: true },
        where: { tenantId, date: { gte: monthStart, lte: monthEnd }, status: { in: ['POSTED','APPROVED','PAID'] } },
      }).catch(() => null);

      const outputVAT = Number(salesAgg?._sum?.vatAmount ?? 0);
      const inputVAT  = Number(purchAgg?._sum?.vatAmount ?? 0);
      const estimatedNet = Math.round((outputVAT - inputVAT) * 100) / 100;

      results.push({ tenantId, estimatedVAT: estimatedNet, notified: true });

      // Create notification record
      await p.notification?.create?.({
        data: {
          tenantId,
          type:    'VAT_RETURN_REMINDER',
          title:   `تذكير: إقرار ضريبة القيمة المضافة — ${period}`,
          message: `الموعد النهائي للتقديم: ${deadline.toISOString().split('T')[0]} (${daysLeft} يوم متبقي)\nالضريبة المقدّرة: ${estimatedNet.toLocaleString('ar-SA')} ر.س`,
          isRead:  false,
        },
      }).catch(() => null);
    });
  }

  // Telegram
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (token && chatId) {
    const totalEstimated = results.reduce((s, r) => s + r.estimatedVAT, 0);
    const msg = [
      `📋 *تذكير: إقرار ضريبة القيمة المضافة*`,
      `📅 الفترة: ${period}`,
      `⏰ الموعد النهائي: ${deadline.toISOString().split('T')[0]}`,
      `🗓️ الأيام المتبقية: ${daysLeft} يوم`,
      `💰 الضريبة المقدرة: ${totalEstimated.toLocaleString('ar-SA')} ر.س`,
      `🏢 المستأجرون: ${tenants.length}`,
      `\n➡️ /api/accounting/vat-return?period=${period}`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }

  log.info('VAT reminder sent', { period, tenants: tenants.length, daysLeft });

  return NextResponse.json({
    period, deadline: deadline.toISOString().split('T')[0], daysLeft,
    tenants: results.length, results,
    message: `✅ تم إرسال تذكير إقرار ${period} — ${daysLeft} يوم متبقي`,
    generatedAt: now.toISOString(),
  });
}
