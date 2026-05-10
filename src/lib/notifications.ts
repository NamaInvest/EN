/**
 * Notification Engine
 * ──────────────────────────────────────────────────────────
 * Multi-channel notification system: In-app, Email, Push, WhatsApp, Telegram.
 * Uses a queue pattern with retry logic and template support.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

const log = logger.child({ service: 'Notifications' });

// ── Internal channel dispatchers ────────────────────────────────────────────

async function dispatchEmail(recipient: string, title: string, body: string): Promise<void> {
  // Persist to email_queue table for pickup by email cron (nodemailer/Resend/SendGrid)
  await (prisma as any).emailQueue?.create?.({
    data: {
      to: recipient,
      subject: title,
      body,
      status: 'pending',
      createdAt: new Date(),
    },
  }).catch(() => {
    // Fallback: log for manual processing if table doesn't exist yet
    log.warn('dispatchEmail: emailQueue table unavailable, logging to structured log', { to: recipient, subject: title });
  });
}

async function dispatchPush(recipient: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  // Persist push notification for service-worker pickup (client polls /api/notifications/push)
  await (prisma as any).pushNotification?.create?.({
    data: {
      userId: recipient,
      title,
      body,
      payload: data ?? {},
      isRead: false,
      createdAt: new Date(),
    },
  }).catch(() => {
    log.warn('dispatchPush: pushNotification table unavailable', { userId: recipient });
  });
}

async function dispatchWhatsApp(phone: string, message: string): Promise<void> {
  // Use existing WhatsApp Business API integration (Meta Cloud API)
  const setting = await prisma.setting.findFirst({ where: { key: 'whatsapp_api_token' } });
  const phoneNumberId = await prisma.setting.findFirst({ where: { key: 'whatsapp_phone_number_id' } });
  if (!setting?.value || !phoneNumberId?.value) {
    log.warn('dispatchWhatsApp: WhatsApp API credentials not configured', { phone });
    return;
  }
  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId.value}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${setting.value}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.replace(/^\+/, ''),
      type: 'text',
      text: { body: message },
    }),
  }).then(r => {
    if (!r.ok) log.warn('dispatchWhatsApp: API returned error', { phone, status: r.status });
  }).catch(err => {
    log.error('dispatchWhatsApp: fetch failed', err?.message);
  });
}

async function dispatchTelegram(chatId: string, message: string): Promise<void> {
  // Use existing telegram bot token from settings
  const setting = await prisma.setting.findUnique({ where: { key: 'telegram_bot_token' } });
  if (!setting?.value) {
    log.warn('dispatchTelegram: Bot token not configured', { chatId });
    return;
  }
  await fetch(`https://api.telegram.org/bot${setting.value}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  }).then(r => {
    if (!r.ok) log.warn('dispatchTelegram: API returned error', { chatId, status: r.status });
  }).catch(err => {
    log.error('dispatchTelegram: fetch failed', err?.message);
  });
}

type Channel = 'in_app' | 'email' | 'push' | 'whatsapp' | 'telegram';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Notification {
  id: string;
  channel: Channel;
  recipient: string;
  title: string;
  body: string;
  priority: Priority;
  data?: Record<string, unknown>;
  templateId?: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  attempts: number;
  createdAt: Date;
  sentAt?: Date;
}

// ── Templates ──
const templates = new Map<string, { titleAr: string; bodyAr: string }>();

templates.set('invoice_created', {
  titleAr: 'فاتورة جديدة',
  bodyAr: 'تم إنشاء الفاتورة رقم {{invoiceNo}} بمبلغ {{total}} ريال',
});
templates.set('payment_received', {
  titleAr: 'دفعة مستلمة',
  bodyAr: 'تم استلام مبلغ {{amount}} ريال من {{customerName}}',
});
templates.set('low_stock', {
  titleAr: 'مخزون منخفض ⚠️',
  bodyAr: 'المنتج {{productName}} وصل الكمية {{quantity}} — أقل من الحد الأدنى',
});
templates.set('approval_required', {
  titleAr: 'موافقة مطلوبة',
  bodyAr: 'طلب موافقة على {{documentType}} بمبلغ {{amount}} ريال',
});
templates.set('payroll_ready', {
  titleAr: 'كشف رواتب جاهز',
  bodyAr: 'كشف رواتب شهر {{month}}/{{year}} جاهز للمراجعة — {{employeeCount}} موظف',
});
templates.set('expense_alert', {
  titleAr: 'تنبيه مصروفات',
  bodyAr: 'تم تسجيل مصروف {{description}} بمبلغ {{amount}} ريال',
});
templates.set('backup_complete', {
  titleAr: 'نسخة احتياطية ✅',
  bodyAr: 'تم إنشاء النسخة الاحتياطية بنجاح — الحجم: {{size}}',
});

// ── Queue ──
const queue: Notification[] = [];
const sentLog: Notification[] = [];
const MAX_LOG = 5000;

let idCounter = 0;
function nextId() { return `notif_${++idCounter}_${Date.now()}`; }

function renderTemplate(templateId: string, vars: Record<string, string>): { title: string; body: string } {
  const tmpl = templates.get(templateId);
  if (!tmpl) return { title: templateId, body: '' };
  let title = tmpl.titleAr;
  let body = tmpl.bodyAr;
  for (const [key, val] of Object.entries(vars)) {
    title = title.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }
  return { title, body };
}

export const notifications = {
  /** Send a notification */
  send(channel: Channel, recipient: string, title: string, body: string, options: {
    priority?: Priority;
    data?: Record<string, unknown>;
    templateId?: string;
    templateVars?: Record<string, string>;
  } = {}): string {
    let finalTitle = title;
    let finalBody = body;

    if (options.templateId && options.templateVars) {
      const rendered = renderTemplate(options.templateId, options.templateVars);
      finalTitle = rendered.title;
      finalBody = rendered.body;
    }

    const notif: Notification = {
      id: nextId(),
      channel,
      recipient,
      title: finalTitle,
      body: finalBody,
      priority: options.priority || 'normal',
      data: options.data,
      templateId: options.templateId,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    queue.push(notif);
    log.info(`Notification queued: ${notif.id} → ${channel}:${recipient}`);
    return notif.id;
  },

  /** Send using template */
  sendTemplate(channel: Channel, recipient: string, templateId: string, vars: Record<string, string>, priority: Priority = 'normal'): string {
    return this.send(channel, recipient, '', '', { templateId, templateVars: vars, priority });
  },

  /** Process queue (called by cron or worker) */
  async processQueue(): Promise<number> {
    let processed = 0;
    while (queue.length > 0) {
      const notif = queue.shift()!;
      notif.attempts++;

      try {
        // Channel-specific delivery
        switch (notif.channel) {
          case 'in_app':
            // Store in DB — handled by the caller
            notif.status = 'sent';
            break;
          case 'email':
            await dispatchEmail(notif.recipient, notif.title, notif.body);
            notif.status = 'sent';
            break;
          case 'push':
            await dispatchPush(notif.recipient, notif.title, notif.body, notif.data);
            notif.status = 'sent';
            break;
          case 'whatsapp':
            await dispatchWhatsApp(notif.recipient, `${notif.title}\n${notif.body}`);
            notif.status = 'sent';
            break;
          case 'telegram':
            await dispatchTelegram(notif.recipient, `<b>${notif.title}</b>\n${notif.body}`);
            notif.status = 'sent';
            break;
        }
        notif.sentAt = new Date();
        processed++;
      } catch (err) {
        notif.status = 'failed';
        if (notif.attempts < 3) {
          queue.push(notif); // Retry
        }
      }

      sentLog.push(notif);
      if (sentLog.length > MAX_LOG) sentLog.splice(0, sentLog.length - MAX_LOG);
    }

    if (processed > 0) log.info(`Processed ${processed} notifications`);
    return processed;
  },

  /** Get notification history */
  getHistory(limit = 50): Notification[] {
    return sentLog.slice(-limit).reverse();
  },

  /** Get pending count */
  getPending(): number {
    return queue.length;
  },

  /** List templates */
  getTemplates(): { id: string; titleAr: string; bodyAr: string }[] {
    return [...templates.entries()].map(([id, t]) => ({ id, ...t }));
  },

  /** Add custom template */
  addTemplate(id: string, titleAr: string, bodyAr: string): void {
    templates.set(id, { titleAr, bodyAr });
  },

  /** Stats */
  stats(): { pending: number; sent: number; failed: number; templates: number } {
    return {
      pending: queue.length,
      sent: sentLog.filter(n => n.status === 'sent').length,
      failed: sentLog.filter(n => n.status === 'failed').length,
      templates: templates.size,
    };
  },
};
