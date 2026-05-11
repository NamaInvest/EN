/**
 * Period Lock Engine
 * ══════════════════════════════════════════════════════════════════════════════
 * يُدير إقفال وفتح الفترات المحاسبية
 *
 * - يمنع ترحيل قيود في فترة مقفلة
 * - يُسجِّل كل قفل/فتح في AuditLog
 * - يدعم الفتح المؤقت للتسويات الطارئة
 * - يُرسل إشعار Telegram عند الإقفال
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'period-lock-engine' });

export type PeriodStatus = 'OPEN' | 'LOCKED' | 'TEMP_UNLOCKED';

export interface PeriodLockResult {
  period:    string;
  status:    PeriodStatus;
  lockedBy:  string | null;
  lockedAt:  Date | null;
  message:   string;
}

export class PeriodLockEngine {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Get period status ──────────────────────────────────────────────────────
  async getStatus(tenantId: string, period: string): Promise<PeriodLockResult> {
    const p = this.prisma as any;
    const record = await p.periodLock?.findFirst?.({
      where: { tenantId, period },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    if (!record) {
      return { period, status: 'OPEN', lockedBy: null, lockedAt: null, message: 'الفترة مفتوحة' };
    }

    return {
      period,
      status:   record.status as PeriodStatus,
      lockedBy: record.lockedBy,
      lockedAt: record.lockedAt,
      message:  record.status === 'LOCKED' ? `مقفلة بواسطة ${record.lockedBy}` : 'مفتوحة مؤقتاً',
    };
  }

  // ── Lock a period ──────────────────────────────────────────────────────────
  async lock(
    tenantId:      string,
    period:        string,
    userId:        string,
    reason?:       string,
    checklistDone: boolean = false,
  ): Promise<PeriodLockResult> {
    const p = this.prisma as any;

    // Verify period is currently OPEN
    const current = await this.getStatus(tenantId, period);
    if (current.status === 'LOCKED') {
      return { ...current, message: `الفترة ${period} مقفلة مسبقاً` };
    }

    if (!checklistDone) {
      // Check if all 14 month-end tasks are done
      const undone = await p.monthEndTask?.findFirst?.({
        where: { tenantId, period, status: { not: 'DONE' } },
        select: { taskCode: true },
      }).catch(() => null);
      if (undone) {
        return {
          period, status: 'OPEN', lockedBy: null, lockedAt: null,
          message: `❌ المهمة ${undone.taskCode} غير مكتملة — أكمل قائمة إقفال الشهر أولاً`,
        };
      }
    }

    const now = new Date();
    await p.periodLock?.upsert?.({
      where: { tenantId_period: { tenantId, period } },
      create: { tenantId, period, status: 'LOCKED', lockedBy: userId, lockedAt: now, reason: reason ?? null },
      update: { status: 'LOCKED', lockedBy: userId, lockedAt: now, reason: reason ?? null },
    }).catch(async () => {
      // Fallback: create record without unique constraint
      await p.periodLock?.create?.({
        data: { tenantId, period, status: 'LOCKED', lockedBy: userId, lockedAt: now, reason: reason ?? null },
      }).catch(() => null);
    });

    // Audit
    await p.auditLog?.create?.({
      data: { tenantId, tableName: 'periodLock', recordId: 0, action: 'PERIOD_LOCK', userId: Number(userId) || 0, createdAt: now },
    }).catch(() => null);

    // Telegram
    await this.notify(`🔒 *إقفال فترة محاسبية*\n📅 الفترة: ${period}\n👤 ${userId}${reason ? `\n📝 ${reason}` : ''}`);

    log.info('Period locked', { tenantId, period, userId });
    return { period, status: 'LOCKED', lockedBy: userId, lockedAt: now, message: `✅ تم إقفال الفترة ${period}` };
  }

  // ── Unlock a period (full or temporary) ───────────────────────────────────
  async unlock(
    tenantId:  string,
    period:    string,
    userId:    string,
    temporary: boolean = false,
    reason?:   string,
  ): Promise<PeriodLockResult> {
    const p   = this.prisma as any;
    const now = new Date();
    const newStatus: PeriodStatus = temporary ? 'TEMP_UNLOCKED' : 'OPEN';

    await p.periodLock?.upsert?.({
      where: { tenantId_period: { tenantId, period } },
      create: { tenantId, period, status: newStatus, lockedBy: null, lockedAt: null, reason: reason ?? null },
      update: { status: newStatus, unlockedBy: userId, unlockedAt: now, reason: reason ?? null },
    }).catch(async () => {
      await p.periodLock?.create?.({
        data: { tenantId, period, status: newStatus, lockedBy: null, lockedAt: null, reason: reason ?? null },
      }).catch(() => null);
    });

    await p.auditLog?.create?.({
      data: { tenantId, tableName: 'periodLock', recordId: 0, action: 'PERIOD_UNLOCK', userId: Number(userId) || 0, createdAt: now },
    }).catch(() => null);

    await this.notify(`🔓 *${temporary ? 'فتح مؤقت' : 'فتح'} فترة محاسبية*\n📅 ${period}\n👤 ${userId}${reason ? `\n📝 ${reason}` : ''}`);

    log.info('Period unlocked', { tenantId, period, userId, temporary });
    return { period, status: newStatus, lockedBy: null, lockedAt: null, message: `✅ تم ${temporary ? 'الفتح المؤقت' : 'فتح'} الفترة ${period}` };
  }

  // ── Check if posting is allowed ────────────────────────────────────────────
  async canPost(tenantId: string, period: string): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getStatus(tenantId, period);
    if (status.status === 'LOCKED') {
      return { allowed: false, reason: `الفترة ${period} مقفلة — تواصل مع المحاسب` };
    }
    return { allowed: true };
  }

  // ── List all period statuses ───────────────────────────────────────────────
  async listPeriods(tenantId: string, fiscalYear: number): Promise<PeriodLockResult[]> {
    const p = this.prisma as any;
    const records = await p.periodLock?.findMany?.({
      where: { tenantId, period: { startsWith: String(fiscalYear) } },
      orderBy: { period: 'asc' },
    }).catch(() => []) ?? [];

    // Fill in all 12 months
    const allPeriods: PeriodLockResult[] = [];
    for (let m = 1; m <= 12; m++) {
      const period = `${fiscalYear}-${String(m).padStart(2, '0')}`;
      const rec    = records.find((r: any) => r.period === period);
      allPeriods.push({
        period,
        status:   rec ? (rec.status as PeriodStatus) : 'OPEN',
        lockedBy: rec?.lockedBy ?? null,
        lockedAt: rec?.lockedAt ?? null,
        message:  rec?.status === 'LOCKED' ? `مقفلة` : 'مفتوحة',
      });
    }
    return allPeriods;
  }

  private async notify(text: string) {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }
}
