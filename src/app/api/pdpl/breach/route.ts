/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL Breach Incident API — `/api/pdpl/breach`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * المرجع القانوني:
 *   - نظام حماية البيانات الشخصية السعودي (PDPL) — المادة 20 / المادة 18
 *   - إلزام تبليغ SDAIA (الهيئة السعودية للبيانات والذكاء الاصطناعي) خلال 72 ساعة
 *     من اكتشاف الاختراقات الحرجة أو العالية الخطورة
 *
 * Endpoints:
 *   GET  /api/pdpl/breach           → قائمة الحوادث (مع pagination + filtering)
 *   POST /api/pdpl/breach           → تسجيل حادثة جديدة (يستدعي recordBreach())
 *
 * Security model (per AI_EXECUTION_STANDARD v2.0 — Gate 1):
 *   - withRoute wrapper: tenant context + auth + rate-limiting (DEFAULT tier)
 *   - RBAC: مقصور على admin / compliance_officer / dpo / owner
 *   - Audit logging: كل mutation يكتب صف في audit_logs
 *   - Observability: logger.child traces مع structured fields
 *
 * Data integrity:
 *   - getPrisma(req) يفرض tenant context تلقائياً (لا تكسير عزل المستأجرين)
 *   - Zod schemas صارمة بـ enums للـ category و severity
 *   - تحويل التواريخ من JSON يحدث بشكل صريح (no implicit casts)
 *
 * @see prisma/schema.prisma — model PdplBreachIncident
 * @see src/lib/pdpl-engine.ts — recordBreach() / getActiveBreaches()
 * @see docs/AI_EXECUTION_STANDARD.md — Gate 1 verification rules
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { recordBreach, getActiveBreaches } from '@/lib/pdpl-engine';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

/** Scoped logger — جميع الـ logs تحت service=pdpl.breach */
const log = logger.child({ service: 'pdpl.breach' });

/**
 * الأدوار المسموح لها بإدارة حوادث PDPL.
 * - admin            : مدير النظام الكامل
 * - compliance_officer: ضابط الامتثال
 * - dpo              : Data Protection Officer
 * - owner            : مالك المنشأة
 *
 * يُمرر إلى withRoute({ roles: [...] }) لتطبيق RBAC.
 */
const ALLOWED_ROLES = ['admin', 'compliance_officer', 'dpo', 'owner'] as const;

/**
 * فئات الاختراقات المعتمدة (تطابق enum في نموذج Prisma).
 * تعتمد على PDPL Art 18 + ISO 27035 incident classification.
 */
const BREACH_CATEGORY = z.enum([
  'UNAUTHORIZED_ACCESS', // وصول غير مصرح به
  'DATA_LEAK',           // تسريب بيانات
  'RANSOMWARE',          // برمجية فدية
  'LOSS',                // فقدان جهاز/ملف يحوي بيانات
  'PHISHING',            // تصيد احتيالي
  'INSIDER_THREAT',      // تهديد من داخل المنشأة
  'OTHER',
]);

/**
 * شدة الاختراق — تحدد إجبارية التبليغ لـ SDAIA.
 * HIGH و CRITICAL → تبليغ خلال 72 ساعة (PDPL Art 20).
 */
const BREACH_SEVERITY = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/**
 * فئات البيانات المتأثرة — لتقييم المخاطر القانونية.
 * يُحوّل إلى JSON في DB.
 */
const AFFECTED_DATA_CATEGORY = z.enum([
  'PII_NAME',
  'PII_PHONE',
  'PII_EMAIL',
  'PII_NATIONAL_ID',
  'PII_IQAMA',
  'PII_PASSPORT',
  'FINANCIAL_IBAN',
  'FINANCIAL_CARD',
  'HEALTH_RECORD',
  'BIOMETRIC',
  'LOCATION',
  'OTHER_SENSITIVE',
]);

/**
 * Schema لإنشاء حادثة جديدة.
 * كل الحقول الإلزامية لها رسائل خطأ بالعربي للـ end-user.
 */
const CreateBreachSchema = z.object({
  category: BREACH_CATEGORY,
  severity: BREACH_SEVERITY,
  affectedRecords: z.number().int().min(0, 'عدد السجلات يجب ألا يكون سالباً'),
  affectedDataCategories: z.array(AFFECTED_DATA_CATEGORY).optional().default([]),
  rootCause: z.string().max(2000).optional().nullable(),
  containmentActions: z.string().max(5000).optional().nullable(),
  detectedAt: z.string().datetime().optional(), // ISO 8601 — لو غير موجود نستخدم now()
});

/**
 * Schema لفلترة قائمة الحوادث (query string).
 * كل الحقول اختيارية — افتراضياً يعرض الحوادث النشطة فقط.
 */
const ListQuerySchema = z.object({
  status: z.enum(['DETECTED', 'CONTAINED', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ALL']).optional().default('ALL'),
  severity: BREACH_SEVERITY.optional(),
  category: BREACH_CATEGORY.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET — قائمة الحوادث مع pagination + filtering
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يجلب قائمة حوادث الاختراق للمستأجر الحالي.
 *
 * Query params:
 *   ?status=DETECTED|CONTAINED|INVESTIGATING|RESOLVED|CLOSED|ALL
 *   ?severity=LOW|MEDIUM|HIGH|CRITICAL
 *   ?category=UNAUTHORIZED_ACCESS|DATA_LEAK|...
 *   ?page=1&pageSize=20
 *
 * Response:
 *   {
 *     items: PdplBreachIncident[],
 *     total: number,
 *     page: number,
 *     pageSize: number,
 *     pageCount: number
 *   }
 *
 * @param ctx RouteContext provided by withRoute (tenant + auth + prisma already bound)
 */
async function handleList(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;

  // Parse + validate query params
  const url = new URL(req.url);
  const queryRaw = Object.fromEntries(url.searchParams.entries());
  const parsed = ListQuerySchema.safeParse(queryRaw);

  if (!parsed.success) {
    log.warn('Invalid query params', { requestId, errors: parsed.error.flatten() });
    return NextResponse.json(
      { error: 'معاملات البحث غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { status, severity, category, page, pageSize } = parsed.data;

  // Build Prisma where clause — احترام عزل المستأجر يتم عبر getPrisma() RLS
  const where: Record<string, any> = {};
  if (status !== 'ALL') where.status = status;
  if (severity) where.severity = severity;
  if (category) where.category = category;

  try {
    // عملية مزدوجة: count + findMany بـ pagination
    const [total, items] = await Promise.all([
      (prisma as any).pdplBreachIncident.count({ where }),
      (prisma as any).pdplBreachIncident.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { detectedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    log.info('Breach list fetched', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      total,
      filters: { status, severity, category },
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to list breaches', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب الحوادث', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — تسجيل حادثة جديدة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يُسجّل حادثة اختراق جديدة في النظام.
 *
 * Workflow:
 *   1. التحقق من الـ body بـ Zod schema صارم
 *   2. استدعاء recordBreach() من pdpl-engine (يحسب 72-hour deadline)
 *   3. كتابة audit log
 *   4. إرجاع الحادثة مع alert + deadline لو HIGH/CRITICAL
 *
 * Response 201:
 *   {
 *     id, category, severity, affectedRecords, status, ...
 *     alert: "⚠️ يجب إبلاغ SDAIA خلال 72 ساعة (PDPL Art 20)" | null,
 *     deadline72h: ISO date | null
 *   }
 */
async function handleCreate(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const startedAt = Date.now();

  // Parse JSON body دون لمس body مرتين
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'محتوى JSON غير صالح' }, { status: 400 });
  }

  // Strict Zod validation
  const parsed = CreateBreachSchema.safeParse(body);
  if (!parsed.success) {
    log.warn('Invalid breach payload', {
      requestId,
      userId: auth.userId,
      errors: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: 'بيانات الحادثة غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    // إنشاء الحادثة عبر الـ engine (لا نكتب SQL مباشر هنا)
    const breach = await recordBreach(prisma, {
      category: payload.category,
      severity: payload.severity,
      affectedRecords: payload.affectedRecords,
      affectedDataCategories: payload.affectedDataCategories,
      rootCause: payload.rootCause ?? undefined,
      ownerUserId: auth.userId,
    });

    // Audit log — لا نوقف العملية لو فشل (logAuditAction يبتلع الخطأ داخلياً)
    await logAuditAction({
      userId: auth.userId,
      action: 'CREATE_PDPL_BREACH',
      tableName: 'pdpl_breach_incidents',
      recordId: breach.id,
      details: JSON.stringify({
        category: payload.category,
        severity: payload.severity,
        affectedRecords: payload.affectedRecords,
        requiresSdaia: payload.severity === 'HIGH' || payload.severity === 'CRITICAL',
      }),
    });

    const durationMs = Date.now() - startedAt;
    log.info('Breach recorded', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      breachId: breach.id,
      severity: payload.severity,
      durationMs,
    });

    return NextResponse.json(breach, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to record breach', {
      requestId,
      userId: auth.userId,
      error: msg,
    });
    return NextResponse.json({ error: 'فشل تسجيل الحادثة', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Exported HTTP handlers (مغلفة بـ withRoute)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET handler — قراءة قائمة الحوادث.
 * - RBAC: مفتوح لكل من ALLOWED_ROLES
 * - Rate-limit: DEFAULT (100 req/min)
 */
export const GET = withRoute(handleList, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});

/**
 * POST handler — تسجيل حادثة جديدة.
 * - RBAC: مفتوح لكل من ALLOWED_ROLES
 * - Rate-limit: DEFAULT
 */
export const POST = withRoute(handleCreate, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
