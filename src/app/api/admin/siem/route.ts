/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SIEM (Security Information & Event Management) API
 *  Endpoint: /api/admin/siem
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  يجمع أحداث الأمان من مصادر متعددة في timeline موحد:
 *   - AuditLog        : كل العمليات في النظام (CREATE/UPDATE/DELETE)
 *   - MfaAttempt      : محاولات MFA (ناجحة/فاشلة)
 *   - FieldAuditLog   : تغييرات على حقول حساسة (PII، financial)
 *   - ComplianceAuditLog : أحداث الامتثال
 *   - SafetyIncident  : حوادث السلامة
 *
 *  يكتشف أنماط:
 *   - Brute force (5+ محاولات MFA فاشلة في 10 دقائق)
 *   - Privilege escalation (تغييرات على روول مستخدم)
 *   - Mass export (DELETE/EXPORT لأكثر من 100 صف)
 *   - Off-hours access (تسجيل دخول خارج ساعات العمل)
 *
 *  Endpoints:
 *   GET  /api/admin/siem?from=<iso>&to=<iso>&severity=<lvl>
 *
 *  Security:
 *   - RBAC: مقصور على admin/owner/security_officer (يكشف حساسة)
 *   - Rate-limit: ADMIN (20 req/min)
 *
 *  @see prisma/schema.prisma — model AuditLog, MfaAttempt
 *  @see src/lib/audit-trail.ts — logAuditEvent helper
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'admin.siem' });

/** الأدوار المسموحة — SIEM يكشف أحداث حساسة */
const ALLOWED_ROLES = ['admin', 'owner', 'security_officer'] as const;

/** أنواع الأحداث الموحدة */
type SiemEventType =
  | 'AUDIT_CREATE'
  | 'AUDIT_UPDATE'
  | 'AUDIT_DELETE'
  | 'AUDIT_EXECUTE'
  | 'AUTH_FAIL'
  | 'RBAC_DENIED'
  | 'ADMIN_BYPASS'
  | 'MFA_SUCCESS'
  | 'MFA_FAIL'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAIL'
  | 'FIELD_CHANGE'
  | 'COMPLIANCE_VIOLATION'
  | 'SAFETY_INCIDENT';

/** شدة الحدث المُحتسبة من نوعه + سياقه */
type SiemSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** حدث موحد كما يُرجع للـ UI */
interface SiemEvent {
  id: string;
  ts: string;                       // ISO timestamp
  type: SiemEventType;
  severity: SiemSeverity;
  source: 'audit' | 'mfa' | 'field_audit' | 'compliance' | 'safety';
  actorId: number | null;
  actorUsername: string | null;
  ipAddress: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;                  // ملخص قابل للقراءة
  metadata: Record<string, unknown>; // raw للـ drilldown
}

/** نمط مكتشَف (pattern) */
interface SiemPattern {
  id: string;
  patternType: 'BRUTE_FORCE' | 'PRIVILEGE_ESCALATION' | 'MASS_EXPORT' | 'OFF_HOURS' | 'MFA_BURST' | 'RBAC_CRAWL' | 'API_BRUTE_FORCE' | 'OFF_HOURS_BYPASS';
  severity: SiemSeverity;
  detectedAt: string;
  description: string;
  relatedEventIds: string[];
  count: number;
}

/**
 * Schema للـ query string.
 */
const QuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ALL']).optional().default('ALL'),
  source: z.enum(['audit', 'mfa', 'field_audit', 'compliance', 'safety', 'ALL']).optional().default('ALL'),
  limit: z.coerce.number().int().min(10).max(500).optional().default(100),
});

/**
 * يستنبط شدة الحدث من نوعه + سياقه.
 *
 * Heuristic:
 *  - MFA fail = MEDIUM
 *  - DELETE on financial entity = HIGH
 *  - permission change = HIGH
 *  - safety incident = CRITICAL
 *  - normal CREATE/UPDATE = INFO
 */
function deriveSeverity(
  type: SiemEventType,
  entityType: string | null,
  metadata: Record<string, unknown>,
): SiemSeverity {
  if (type === 'SAFETY_INCIDENT') return 'CRITICAL';
  if (type === 'COMPLIANCE_VIOLATION') return 'HIGH';
  if (type === 'MFA_FAIL') return 'MEDIUM';
  if (type === 'LOGIN_FAIL') return 'MEDIUM';
  if (type === 'AUTH_FAIL') return 'MEDIUM';
  if (type === 'RBAC_DENIED') return 'HIGH';
  if (type === 'ADMIN_BYPASS') return 'MEDIUM';
  if (type === 'AUDIT_DELETE') {
    if (entityType && /journal|invoice|payment|payroll/i.test(entityType)) return 'HIGH';
    return 'MEDIUM';
  }
  if (type === 'FIELD_CHANGE') {
    const field = String((metadata as any)?.fieldName ?? '');
    if (/role|permission|iqama|iban|password/i.test(field)) return 'HIGH';
    return 'LOW';
  }
  return 'INFO';
}

const SENSITIVE_FIELDS = ['password', 'iban', 'nationalid', 'iqama', 'totp', 'secret', 'token', 'key'];

function maskSensitiveFieldValues(fieldName: string, value: string | null): string | null {
  if (!value) return null;
  const lowerField = fieldName.toLowerCase();
  
  if (SENSITIVE_FIELDS.some(f => lowerField.includes(f))) {
    if (lowerField.includes('iban')) {
      return value.slice(0, 4) + '****************' + value.slice(-4);
    }
    return '[REDACTED_PII_LOG_SAFE]';
  }
  return value;
}

/**

 * يكتشف أنماط هجوم أو سلوك مشبوه من مجموعة أحداث.
 *
 * Detection rules:
 *   1. BRUTE_FORCE: 5+ MFA_FAIL من نفس IP في 10 دقائق
 *   2. MFA_BURST: 3+ MFA_FAIL من نفس userId في 5 دقائق
 *   3. MASS_EXPORT: > 50 audit events من نفس actor في دقيقة واحدة
 *   4. OFF_HOURS: تسجيل دخول بين 22:00 و 06:00 (الرياض)
 *   5. PRIVILEGE_ESCALATION: تغيير role/permission على user آخر
 */
export function detectPatterns(events: SiemEvent[]): SiemPattern[] {
  const patterns: SiemPattern[] = [];

  // Pattern 1: BRUTE_FORCE — تجميع MFA_FAIL حسب IP
  const mfaFailsByIp: Record<string, SiemEvent[]> = {};
  for (const e of events) {
    if (e.type === 'MFA_FAIL' && e.ipAddress) {
      (mfaFailsByIp[e.ipAddress] ||= []).push(e);
    }
  }
  for (const [ip, evs] of Object.entries(mfaFailsByIp)) {
    // نتحقق من النافذة الزمنية (10 دقائق)
    const recent = evs.filter((e) => Date.now() - new Date(e.ts).getTime() < 10 * 60 * 1000);
    if (recent.length >= 5) {
      patterns.push({
        id: `brute_${ip}_${Date.now()}`,
        patternType: 'BRUTE_FORCE',
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
        description: `${recent.length} فشل MFA من IP ${ip} خلال 10 دقائق`,
        relatedEventIds: recent.map((e) => e.id),
        count: recent.length,
      });
    }
  }

  // Pattern 2: MFA_BURST — حسب user
  const mfaFailsByUser: Record<number, SiemEvent[]> = {};
  for (const e of events) {
    if (e.type === 'MFA_FAIL' && e.actorId !== null) {
      (mfaFailsByUser[e.actorId] ||= []).push(e);
    }
  }
  for (const [uid, evs] of Object.entries(mfaFailsByUser)) {
    const recent = evs.filter((e) => Date.now() - new Date(e.ts).getTime() < 5 * 60 * 1000);
    if (recent.length >= 3) {
      patterns.push({
        id: `mfaburst_${uid}_${Date.now()}`,
        patternType: 'MFA_BURST',
        severity: 'MEDIUM',
        detectedAt: new Date().toISOString(),
        description: `${recent.length} محاولات MFA فاشلة للمستخدم #${uid} خلال 5 دقائق`,
        relatedEventIds: recent.map((e) => e.id),
        count: recent.length,
      });
    }
  }

  // Pattern 3: MASS_EXPORT — > 50 events من نفس actor في دقيقة
  const eventsByActor: Record<number, SiemEvent[]> = {};
  for (const e of events) {
    if (e.actorId !== null) (eventsByActor[e.actorId] ||= []).push(e);
  }
  for (const [uid, evs] of Object.entries(eventsByActor)) {
    const recent = evs.filter((e) => Date.now() - new Date(e.ts).getTime() < 60 * 1000);
    if (recent.length > 50) {
      patterns.push({
        id: `massexport_${uid}_${Date.now()}`,
        patternType: 'MASS_EXPORT',
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
        description: `${recent.length} عملية من المستخدم #${uid} خلال دقيقة`,
        relatedEventIds: recent.slice(0, 10).map((e) => e.id),
        count: recent.length,
      });
    }
  }

  // Pattern 4: OFF_HOURS — login بين 22:00 - 06:00 Riyadh
  for (const e of events) {
    if (e.type === 'LOGIN_SUCCESS' || e.type === 'MFA_SUCCESS') {
      const hourRiyadh = (new Date(e.ts).getUTCHours() + 3) % 24; // UTC+3
      if (hourRiyadh >= 22 || hourRiyadh < 6) {
        patterns.push({
          id: `offhours_${e.id}`,
          patternType: 'OFF_HOURS',
          severity: 'LOW',
          detectedAt: e.ts,
          description: `تسجيل دخول الساعة ${hourRiyadh}:00 (خارج ساعات العمل)`,
          relatedEventIds: [e.id],
          count: 1,
        });
      }
    }
  }

  // Pattern 5: PRIVILEGE_ESCALATION — تعديل role/permission
  for (const e of events) {
    if (e.type === 'FIELD_CHANGE') {
      const field = String((e.metadata as any)?.fieldName ?? '');
      if (/role|permission/i.test(field)) {
        patterns.push({
          id: `privesc_${e.id}`,
          patternType: 'PRIVILEGE_ESCALATION',
          severity: 'HIGH',
          detectedAt: e.ts,
          description: `تعديل ${field} على المستخدم ${e.entityId} بواسطة actor #${e.actorId}`,
          relatedEventIds: [e.id],
          count: 1,
        });
      }
    }
  }

  // ─── Phase 5 Part 2B Detection Rules ────────────────────────────────────────

  // Threshold constants
  const RBAC_CRAWL_THRESHOLD = 3;
  const RBAC_CRAWL_WINDOW_MS = 5 * 60 * 1000;

  const API_BRUTE_FORCE_THRESHOLD = 5;
  const API_BRUTE_FORCE_WINDOW_MS = 10 * 60 * 1000;

  // Pattern 6: RBAC_CRAWL — تكرار محاولات الدخول الممنوع لنفس المستخدم
  const rbacDeniedByUser: Record<number, SiemEvent[]> = {};
  for (const e of events) {
    if (e.type === 'RBAC_DENIED' && e.actorId !== null) {
      (rbacDeniedByUser[e.actorId] ||= []).push(e);
    }
  }
  for (const [uid, evs] of Object.entries(rbacDeniedByUser)) {
    const recent = evs.filter((e) => Date.now() - new Date(e.ts).getTime() < RBAC_CRAWL_WINDOW_MS);
    if (recent.length >= RBAC_CRAWL_THRESHOLD) {
      patterns.push({
        id: `rbaccrawl_${uid}_${Date.now()}`,
        patternType: 'RBAC_CRAWL',
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
        description: `${recent.length} محاولات دخول مرفوضة للـ RBAC للمستخدم #${uid} خلال 5 دقائق`,
        relatedEventIds: recent.map((e) => e.id),
        count: recent.length,
      });
    }
  }

  // Pattern 7: API_BRUTE_FORCE — محاولات ولوج غير مصادقة مكثفة من نفس الـ IP
  const authFailsByIp: Record<string, SiemEvent[]> = {};
  for (const e of events) {
    if (e.type === 'AUTH_FAIL' && e.ipAddress) {
      (authFailsByIp[e.ipAddress] ||= []).push(e);
    }
  }
  for (const [ip, evs] of Object.entries(authFailsByIp)) {
    const recent = evs.filter((e) => Date.now() - new Date(e.ts).getTime() < API_BRUTE_FORCE_WINDOW_MS);
    if (recent.length >= API_BRUTE_FORCE_THRESHOLD) {
      patterns.push({
        id: `apibrute_${ip}_${Date.now()}`,
        patternType: 'API_BRUTE_FORCE',
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
        description: `${recent.length} محاولات دخول غير مصرحة (AUTH_FAIL) من عنوان IP ${ip} خلال 10 دقائق`,
        relatedEventIds: recent.map((e) => e.id),
        count: recent.length,
      });
    }
  }

  // Pattern 8: OFF_HOURS_BYPASS — استخدام صلاحية تخطي المسؤولين خارج أوقات العمل
  for (const e of events) {
    if (e.type === 'ADMIN_BYPASS') {
      const hourRiyadh = (new Date(e.ts).getUTCHours() + 3) % 24; // UTC+3 Riyadh
      if (hourRiyadh >= 22 || hourRiyadh < 6) {
        patterns.push({
          id: `bypass_offhours_${e.id}`,
          patternType: 'OFF_HOURS_BYPASS',
          severity: 'MEDIUM',
          detectedAt: e.ts,
          description: `تخطي أمني للمسؤول (ADMIN_BYPASS) الساعة ${hourRiyadh}:00 (خارج ساعات العمل الرسمية)`,
          relatedEventIds: [e.id],
          count: 1,
        });
      }
    }
  }

  return patterns;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET — قائمة الأحداث الموحدة + الأنماط المكتشفة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يستعلم عن أحداث الأمان من 5 مصادر مختلفة ويوحّدها.
 *
 * Response:
 *   {
 *     events: SiemEvent[],
 *     patterns: SiemPattern[],
 *     summary: { total, bySeverity, byType, bySource },
 *     window: { from, to }
 *   }
 */
async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const startedAt = Date.now();

  const url = new URL(req.url);
  const queryRaw = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(queryRaw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'معاملات بحث غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { from, to, severity, source, limit } = parsed.data;

  // Default time window: آخر 24 ساعة
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 24 * 60 * 60 * 1000);

  try {
    // اجلب من المصادر بالتوازي — حد limit لكل مصدر لتجنب memory blow up
    const sourceLimit = Math.ceil(limit / 3);

    const [auditLogs, mfaAttempts, fieldAudits] = await Promise.all([
      // 1. AuditLog
      source === 'ALL' || source === 'audit'
        ? (prisma as any).auditLog.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            include: { user: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
            take: sourceLimit,
          })
        : [],

      // 2. MfaAttempt
      source === 'ALL' || source === 'mfa'
        ? (prisma as any).mfaAttempt.findMany({
            where: { attemptedAt: { gte: fromDate, lte: toDate } },
            include: { user: { select: { id: true, username: true } } },
            orderBy: { attemptedAt: 'desc' },
            take: sourceLimit,
          })
        : [],

      // 3. FieldAuditLog (لو موجود — لو مش موجود نتجاهل)
      source === 'ALL' || source === 'field_audit'
        ? (prisma as any).fieldAuditLog
            ?.findMany({
              where: { createdAt: { gte: fromDate, lte: toDate } },
              orderBy: { createdAt: 'desc' },
              take: sourceLimit,
            })
            .catch(() => [])
        : [],
    ]);

    // وحّد الأحداث في شكل SiemEvent[]
    const events: SiemEvent[] = [];

    // Map AuditLog → SiemEvent
    for (const a of auditLogs) {
      const actionUpper = String(a.action || '').toUpperCase();
      let type: SiemEventType = 'AUDIT_EXECUTE';
      if (a.action === 'AUTH_FAIL') type = 'AUTH_FAIL';
      else if (a.action === 'RBAC_DENIED') type = 'RBAC_DENIED';
      else if (a.action === 'ADMIN_BYPASS') type = 'ADMIN_BYPASS';
      else if (actionUpper.includes('CREATE')) type = 'AUDIT_CREATE';
      else if (actionUpper.includes('UPDATE')) type = 'AUDIT_UPDATE';
      else if (actionUpper.includes('DELETE')) type = 'AUDIT_DELETE';

      const metadata = {
        details: a.details,
        oldData: a.oldData,
        newData: a.newData,
        diff: a.diff,
      };
      events.push({
        id: `audit:${a.id}`,
        ts: a.createdAt?.toISOString?.() ?? new Date().toISOString(),
        type,
        severity: deriveSeverity(type, a.entityType, metadata),
        source: 'audit',
        actorId: a.userId,
        actorUsername: a.user?.username ?? null,
        ipAddress: a.ipAddress || null,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        summary: `${a.action} على ${a.entityType || 'unknown'} #${a.entityId || '?'}`,
        metadata,
      });
    }

    // Map MfaAttempt → SiemEvent
    for (const m of mfaAttempts) {
      const type: SiemEventType = m.success ? 'MFA_SUCCESS' : 'MFA_FAIL';
      const metadata = {
        method: m.method,
        failureReason: m.failureReason,
        countryCode: m.countryCode,
        city: m.city,
        userAgent: m.userAgent,
      };
      events.push({
        id: `mfa:${m.id}`,
        ts: m.attemptedAt?.toISOString?.() ?? new Date().toISOString(),
        type,
        severity: deriveSeverity(type, 'User', metadata),
        source: 'mfa',
        actorId: m.userId,
        actorUsername: m.user?.username ?? null,
        ipAddress: m.ipAddress,
        action: m.success ? 'MFA_SUCCESS' : 'MFA_FAIL',
        entityType: 'User',
        entityId: String(m.userId),
        summary: m.success
          ? `نجح MFA (${m.method}) من ${m.city || m.countryCode || m.ipAddress || 'unknown'}`
          : `فشل MFA (${m.method}) — السبب: ${m.failureReason || 'unknown'}`,
        metadata,
      });
    }

    // Map FieldAuditLog → SiemEvent (لو موجود)
    if (Array.isArray(fieldAudits)) {
      for (const f of fieldAudits) {
        const metadata = {
          fieldName: f.fieldName,
          oldValue: maskSensitiveFieldValues(f.fieldName, f.oldValue),
          newValue: maskSensitiveFieldValues(f.fieldName, f.newValue),
        };
        events.push({
          id: `field:${f.id}`,
          ts: f.createdAt?.toISOString?.() ?? new Date().toISOString(),
          type: 'FIELD_CHANGE',
          severity: deriveSeverity('FIELD_CHANGE', f.entityType, metadata),
          source: 'field_audit',
          actorId: f.userId ?? null,
          actorUsername: null,
          ipAddress: null,
          action: 'FIELD_CHANGE',
          entityType: f.entityType,
          entityId: f.entityId,
          summary: `تغيير حقل ${f.fieldName} في ${f.entityType} #${f.entityId}`,
          metadata,
        });
      }
    }

    // Sort by timestamp DESC
    events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // Filter by severity
    const filtered = severity === 'ALL' ? events : events.filter((e) => e.severity === severity);

    // Limit
    const limited = filtered.slice(0, limit);

    // اكشف الأنماط من الـ filtered (وليس limited عشان نشوف كل النافذة)
    const patterns = detectPatterns(filtered);

    // Summary
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const e of limited) {
      bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      bySource[e.source] = (bySource[e.source] ?? 0) + 1;
    }

    log.info('SIEM events fetched', {
      requestId,
      userId: auth.userId,
      total: limited.length,
      patterns: patterns.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      events: limited,
      patterns,
      summary: { total: limited.length, bySeverity, byType, bySource },
      window: { from: fromDate.toISOString(), to: toDate.toISOString() },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to fetch SIEM data', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب أحداث الأمان', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Exported handler
// ═══════════════════════════════════════════════════════════════════════════

export const GET = withRoute(handleGet, {
  rateLimit: 'ADMIN',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
