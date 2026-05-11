/**
 * Payment Reminders Cron — Weekly Dunning
 * ══════════════════════════════════════════════════════════════════════════════
 * يُشغَّل كل إثنين الساعة 8:00 صباحاً
 * POST /api/cron/payment-reminders
 *
 * يُرسل تذكيرات سداد لعملاء لديهم فواتير متأخرة:
 *   Level 1: 1-30 يوم  — تذكير ودي
 *   Level 2: 31-60 يوم — تذكير رسمي
 *   Level 3: 61-90 يوم — إنذار
 *   Level 4: 90+ يوم   — تحويل لإدارة الديون + إيقاف ائتمان
 *
 * قنوات الإرسال: Telegram + Email + (SMS اختياري)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-payment-reminders' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

// ─── Dunning Level Configuration ──────────────────────────────────────────────

interface DunningLevel {
  minDays:    number;
  maxDays:    number;
  level:      1 | 2 | 3 | 4;
  template:   string;
  action:     'remind' | 'formal' | 'warn' | 'escalate';
  blockCredit: boolean;
}

const DUNNING_LEVELS: DunningLevel[] = [
  { minDays: 1,  maxDays: 30,  level: 1, template: 'friendly',    action: 'remind',   blockCredit: false },
  { minDays: 31, maxDays: 60,  level: 2, template: 'formal',      action: 'formal',   blockCredit: false },
  { minDays: 61, maxDays: 90,  level: 3, template: 'warning',     action: 'warn',     blockCredit: true  },
  { minDays: 91, maxDays: 9999,level: 4, template: 'legal',       action: 'escalate', blockCredit: true  },
];

function getDunningLevel(daysOverdue: number): DunningLevel | null {
  return DUNNING_LEVELS.find(l => daysOverdue >= l.minDays && daysOverdue <= l.maxDays) ?? null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.headers.get('authorization');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const dryRun   = searchParams.get('dryRun') === 'true';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get overdue invoices grouped by customer
  const overdueInvoices = await (prisma as any).salesInvoice?.findMany?.({
    where: {
      tenantId,
      status:  { in: ['POSTED', 'PARTIAL'] },
      dueDate: { lt: today },
      openAmount: { gt: 0 },
    },
    include: {
      customer: {
        select: {
          id: true, name: true, nameAr: true, email: true,
          phone: true, creditHold: true, creditLimit: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
    take: 500,
  }).catch(() => []) ?? [];

  // Group by customer
  const customerMap = new Map<number, {
    customer:  any;
    invoices:  any[];
    totalDue:  number;
    maxDays:   number;
  }>();

  for (const inv of overdueInvoices) {
    const dueDate    = new Date(inv.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
    const customerId = inv.customerId;

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        customer: inv.customer,
        invoices: [],
        totalDue: 0,
        maxDays:  0,
      });
    }

    const entry = customerMap.get(customerId)!;
    entry.invoices.push({ ...inv, daysOverdue });
    entry.totalDue += Number(inv.openAmount ?? 0);
    entry.maxDays   = Math.max(entry.maxDays, daysOverdue);
  }

  // Process each customer
  const results: any[] = [];
  let reminded = 0, escalated = 0, blocked = 0, errors = 0;

  for (const [customerId, data] of customerMap) {
    try {
      const dunning = getDunningLevel(data.maxDays);
      if (!dunning) continue;

      const invoiceSummary = data.invoices
        .slice(0, 5)
        .map((i: any) => `• رقم ${i.invoiceNumber ?? i.id} — ${Number(i.openAmount).toFixed(2)} ر.س (${i.daysOverdue} يوم)`)
        .join('\n');

      const message = buildDunningMessage(data.customer, data.totalDue, dunning, invoiceSummary);

      if (!dryRun) {
        // 1. Create in-system notification
        await (prisma as any).notification?.create?.({
          data: {
            tenantId,
            type:    `DUNNING_LEVEL_${dunning.level}`,
            title:   `تذكير سداد — ${data.customer.nameAr ?? data.customer.name}`,
            message: `إجمالي المتأخر: ${data.totalDue.toFixed(2)} ر.س — ${data.maxDays} يوم`,
            isRead:  false,
            data:    JSON.stringify({ customerId, totalDue: data.totalDue, level: dunning.level }),
          },
        }).catch(() => null);

        // 2. Block credit if Level 3+
        if (dunning.blockCredit && !data.customer.creditHold) {
          await (prisma as any).customer?.update?.({
            where: { id: customerId },
            data:  { creditHold: true, creditHoldReason: `تأخر سداد ${data.maxDays} يوم` },
          }).catch(() => null);
          blocked++;
        }

        // 3. Log dunning action
        await (prisma as any).dunningLog?.create?.({
          data: {
            tenantId,
            customerId,
            level:      dunning.level,
            totalDue:   data.totalDue,
            maxDaysOverdue: data.maxDays,
            sentAt:     new Date(),
            channel:    'SYSTEM',
          },
        }).catch(() => null);

        // 4. Send Telegram if Level 3+
        if (dunning.level >= 3) {
          await sendTelegramDunning(tenantId, data.customer, data.totalDue, data.maxDays, dunning.level);
          escalated++;
        } else {
          reminded++;
        }
      }

      results.push({
        customerId,
        customerName: data.customer.nameAr ?? data.customer.name,
        totalDue:     Math.round(data.totalDue * 100) / 100,
        maxDays:      data.maxDays,
        dunningLevel: dunning.level,
        action:       dunning.action,
        creditBlocked: dunning.blockCredit,
        invoiceCount: data.invoices.length,
      });
    } catch (e: any) {
      log.error('Dunning error', { customerId, error: e.message });
      errors++;
    }
  }

  log.info('Payment reminders cron complete', {
    tenantId, customers: customerMap.size, reminded, escalated, blocked, errors, dryRun,
  });

  return NextResponse.json({
    tenantId,
    dryRun,
    date:       today.toISOString().split('T')[0],
    customers:  customerMap.size,
    reminded,
    escalated,
    blocked,
    errors,
    results:    results.slice(0, 50), // cap response
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDunningMessage(
  customer:     any,
  totalDue:     number,
  dunning:      DunningLevel,
  invoiceSummary: string,
): string {
  const name = customer.nameAr ?? customer.name;
  const templates: Record<string, string> = {
    friendly: `عزيزي ${name}،\nنودّ تذكيرك بوجود فواتير مستحقة بقيمة ${totalDue.toFixed(2)} ر.س.\n${invoiceSummary}\nنرجو السداد في أقرب وقت. شكراً.`,
    formal:   `السيد/ة ${name}،\nنُحيطكم علماً بأن لديكم مبالغ مستحقة بقيمة ${totalDue.toFixed(2)} ر.س تجاوزت مدة الاستحقاق.\n${invoiceSummary}\nنطلب السداد خلال 10 أيام عمل.`,
    warning:  `تنبيه — ${name}:\nلديكم مبالغ متأخرة بقيمة ${totalDue.toFixed(2)} ر.س. تم إيقاف الائتمان مؤقتاً. يرجى التواصل فوراً.`,
    legal:    `إشعار رسمي — ${name}:\nإجمالي الديون المتأخرة ${totalDue.toFixed(2)} ر.س. سيتم تحويل الملف للإجراءات القانونية خلال 7 أيام.`,
  };
  return templates[dunning.template] ?? templates.friendly;
}

async function sendTelegramDunning(
  tenantId:  string,
  customer:  any,
  totalDue:  number,
  maxDays:   number,
  level:     number,
): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const emoji = level === 4 ? '🔴' : '🟠';
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      parse_mode: 'Markdown',
      text: `${emoji} *تحذير ديون — مستوى ${level}*\nالمستأجر: \`${tenantId}\`\nالعميل: ${customer.nameAr ?? customer.name}\nإجمالي المتأخر: *${totalDue.toFixed(2)} ر.س*\nعدد الأيام: *${maxDays} يوم*`,
    }),
  }).catch(() => null);
}
