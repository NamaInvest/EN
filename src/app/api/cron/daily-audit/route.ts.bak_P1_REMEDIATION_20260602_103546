/**
 * Daily Audit Digest Cron
 * ══════════════════════════════════════════════════════════════════════════════
 * يُشغَّل يومياً الساعة 3:00 صباحاً
 * POST /api/cron/daily-audit
 *
 * يُجمّع AuditLog اليوم السابق ويُرسل ملخصاً لـ:
 *   1. عمليات الحذف (DELETE) — أعلى خطورة
 *   2. التعديلات المالية (JournalEntry, Invoice) — للمراجعة
 *   3. تغيير الصلاحيات وكلمات المرور
 *   4. عمليات المبالغ الكبيرة (> threshold)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma, { withTenant } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-daily-audit' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

// Tables with high-risk delete operations
const HIGH_RISK_TABLES = ['journalEntry', 'salesInvoice', 'purchaseInvoice', 'payrollRecord', 'employee'];
// Large amount threshold (SAR)
const LARGE_AMOUNT_THRESHOLD = 100_000;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.headers.get('authorization');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const date     = searchParams.get('date'); // optional: override date (YYYY-MM-DD)

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  return withTenant(tenantId, async () => {
    // Build date range (yesterday by default)
    const auditDate = date ? new Date(date) : new Date();
    auditDate.setDate(auditDate.getDate() - 1);
    const fromDate = new Date(auditDate);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(auditDate);
    toDate.setHours(23, 59, 59, 999);

    // 1. All audit logs for the period
    const auditLogs = await (prisma as any).auditLog?.findMany?.({
      where: {
        tenantId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }).catch(() => []) ?? [];

    // 2. Categorize
    const deletes      = auditLogs.filter((l: any) => l.action === 'DELETE');
    const updates      = auditLogs.filter((l: any) => l.action === 'UPDATE');
    const creates      = auditLogs.filter((l: any) => l.action === 'CREATE');
    const highRisk     = deletes.filter((l: any) => HIGH_RISK_TABLES.includes(l.tableName));
    const authChanges  = auditLogs.filter((l: any) =>
      l.tableName === 'user' && l.diff && (l.diff.password || l.diff.role || l.diff.permissions)
    );

    // 3. High-value journal entries (check JournalEntry creates/updates)
    const largeJournals = await (prisma as any).journalEntry?.findMany?.({
      where: {
        tenantId,
        createdAt:  { gte: fromDate, lte: toDate },
        totalDebit: { gte: LARGE_AMOUNT_THRESHOLD },
      },
      select: { id: true, date: true, description: true, totalDebit: true, reference: true, createdBy: true },
      take: 20,
    }).catch(() => []) ?? [];

    // 4. Build digest summary
    const digest = {
      tenantId,
      date:          auditDate.toISOString().split('T')[0],
      summary: {
        totalEvents:     auditLogs.length,
        creates:         creates.length,
        updates:         updates.length,
        deletes:         deletes.length,
        highRiskDeletes: highRisk.length,
        authChanges:     authChanges.length,
        largeJournals:   largeJournals.length,
      },
      alerts: {
        highRiskDeletes: highRisk.map((l: any) => ({
          table:   l.tableName,
          recordId: l.recordId,
          user:    l.user?.name ?? `User #${l.userId}`,
          at:      l.createdAt,
        })),
        authChanges: authChanges.map((l: any) => ({
          userId:  l.recordId,
          user:    l.user?.name,
          changes: Object.keys(l.diff ?? {}),
          at:      l.createdAt,
        })),
        largeJournals: largeJournals.map((j: any) => ({
          id:          j.id,
          reference:   j.reference,
          description: j.description,
          amount:      Number(j.totalDebit),
          createdBy:   j.createdBy,
        })),
      },
      riskScore: calculateRiskScore(highRisk.length, authChanges.length, largeJournals.length),
      generatedAt: new Date().toISOString(),
    };

    // 5. Send Telegram notification if high risk
    if (digest.riskScore >= 7) {
      await sendTelegramAlert(tenantId, digest);
    }

    // 6. Save digest snapshot
    await (prisma as any).auditDigest?.create?.({
      data: {
        tenantId,
        date:      auditDate,
        summary:   JSON.stringify(digest.summary),
        alerts:    JSON.stringify(digest.alerts),
        riskScore: digest.riskScore,
      },
    }).catch(() => null);

    log.info('Daily audit digest complete', {
      tenantId,
      date: digest.date,
      events: digest.summary.totalEvents,
      riskScore: digest.riskScore,
    });

    return NextResponse.json(digest);
  });
}

function calculateRiskScore(highRiskDeletes: number, authChanges: number, largeJournals: number): number {
  let score = 0;
  score += Math.min(highRiskDeletes * 3, 6);  // max 6 for deletes
  score += Math.min(authChanges * 2, 4);       // max 4 for auth changes
  score += Math.min(largeJournals, 3);         // max 3 for large journals
  return Math.min(score, 10);                   // cap at 10
}

async function sendTelegramAlert(tenantId: string, digest: any): Promise<void> {
  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const chatId  = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const emoji   = digest.riskScore >= 8 ? '🔴' : '🟠';
  const message = [
    `${emoji} *تنبيه تدقيق يومي — ${digest.date}*`,
    `المستأجر: \`${tenantId}\``,
    `درجة الخطر: *${digest.riskScore}/10*`,
    ``,
    `📊 الملخص:`,
    `• إجمالي الأحداث: ${digest.summary.totalEvents}`,
    `• حذف عمليات حساسة: ${digest.summary.highRiskDeletes}`,
    `• تغيير صلاحيات: ${digest.summary.authChanges}`,
    `• قيود كبيرة (>${LARGE_AMOUNT_THRESHOLD} ر.س): ${digest.summary.largeJournals}`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      text:       message,
      parse_mode: 'Markdown',
    }),
  }).catch(() => null);
}
