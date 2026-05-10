/**
 * Unified API Route Handler
 * ──────────────────────────────────────────────────────────
 * Wraps Next.js API route handlers with:
 * - Structured logging (request → response)
 * - Automatic error handling (Zod, Prisma, known errors)
 * - Rate limiting (configurable per route)
 * - Request ID tracking
 * - Response time measurement
 * 
 * Usage:
 *   export const POST = withApiHandler(async (req, ctx) => {
 *     const body = ctx.parseBody(salesCreateSchema);
 *     // ... business logic
 *     return ctx.success(data, 201);
 *   }, { rateLimit: { max: 30 } });
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { logger } from './logger';

const log = logger.child({ service: "api-handler" });
import { rateLimit } from './rate-limit';

// ── Prisma error codes → user-friendly Arabic messages ──
const PRISMA_ERRORS: Record<string, { message: string; status: number }> = {
  P2002: { message: 'البيانات موجودة مسبقاً (تكرار)', status: 409 },
  P2025: { message: 'السجل المطلوب غير موجود', status: 404 },
  P2003: { message: 'خطأ في العلاقات — تأكد من صحة المراجع', status: 400 },
  P2014: { message: 'هذه البيانات مرتبطة بسجلات أخرى', status: 400 },
  P2016: { message: 'خطأ في الاستعلام', status: 400 },
};

// ── AppError: thrown intentionally with a user-visible message ──
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

// ── Handler Context (injected into each route) ──
export interface HandlerContext {
  /** Parse & validate request body using a Zod schema */
  parseBody: <T>(schema: ZodSchema<T>) => Promise<T>;
  /** Parse & validate query params using a Zod schema */
  parseQuery: <T>(schema: ZodSchema<T>) => T;
  /** Return a success JSON response */
  success: (data?: any, status?: number) => NextResponse;
  /** Unique request ID for log correlation */
  requestId: string;
  /** Tenant ID from header */
  tenantId: string;
  /** Log helper bound to this request */
  log: ReturnType<typeof logger.child>;
}

interface HandlerOptions {
  /** Rate limit configuration (null to disable) */
  rateLimit?: { max?: number; windowMs?: number } | null;
}

type RouteHandler = (req: NextRequest, ctx: HandlerContext) => Promise<NextResponse>;

/**
 * withApiHandler — wrap any API route with production-grade middleware
 */
export function withApiHandler(handler: RouteHandler, options: HandlerOptions = {}) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    const pathname = new URL(req.url).pathname;
    const tenantId = req.headers.get('x-tenant-id') || 'default';

    try {
      // ── Rate Limiting ──
      if (options.rateLimit !== null) {
        const rlOpts = options.rateLimit || { max: 60, windowMs: 60_000 };
        const result = await rateLimit(req, rlOpts);
        if (!result.allowed) {
          log.warn('Rate limit exceeded');
          return NextResponse.json(
            { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                'X-Request-Id': requestId,
              },
            }
          );
        }
      }

      // ── Build context ──
      const ctx: HandlerContext = {
        requestId,
        tenantId,
        log,
        parseBody: async <T>(schema: ZodSchema<T>): Promise<T> => {
          const raw = await req.json();
          return schema.parse(raw);
        },
        parseQuery: <T>(schema: ZodSchema<T>): T => {
          const params = Object.fromEntries(new URL(req.url).searchParams.entries());
          return schema.parse(params);
        },
        success: (data?: any, status = 200) => {
          return NextResponse.json(data ?? { success: true }, {
            status,
            headers: { 'X-Request-Id': requestId },
          });
        },
      };

      // ── Execute handler ──
      const response = await handler(req, ctx);

      // ── Log success ──
      const duration = Date.now() - startTime;
      log.info(`${req.method} ${pathname} → ${response.status}`, { duration });

      // Attach request ID to response
      response.headers.set('X-Request-Id', requestId);
      return response;

    } catch (error: any) {
      const duration = Date.now() - startTime;

      // ── Zod validation errors → 400 with field details ──
      if (error instanceof ZodError) {
        const messages = error.issues.map((e) => `${(e.path as any[]).join('.')}: ${e.message}`).join('، ');
        log.warn(`Validation failed: ${messages}`, { duration });
        return NextResponse.json(
          { error: `خطأ في البيانات: ${messages}`, fields: error.issues },
          { status: 400, headers: { 'X-Request-Id': requestId } }
        );
      }

      // ── AppError (intentional) → known status ──
      if (error instanceof AppError) {
        log.warn(`AppError: ${error.message}`, { duration });
        return NextResponse.json(
          { error: error.message },
          { status: error.status, headers: { 'X-Request-Id': requestId } }
        );
      }

      // ── Prisma errors → mapped status ──
      if (error?.code && PRISMA_ERRORS[error.code]) {
        const pe = PRISMA_ERRORS[error.code];
        log.warn(`Prisma ${error.code}: ${pe.message}`, { duration });
        return NextResponse.json(
          { error: pe.message },
          { status: pe.status, headers: { 'X-Request-Id': requestId } }
        );
      }

      // ── Legacy knownError pattern ──
      if (error?.isKnownError && error?.message) {
        log.warn(`Known: ${error.message}`, { duration });
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 400, headers: { 'X-Request-Id': requestId } }
        );
      }

      // ── Unknown error → 500 (don't leak details) ──
      log.error(`Unhandled: ${error?.message || 'Unknown'}`, { duration, stack: error?.stack?.slice(0, 500) });
      return NextResponse.json(
        { error: 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.' },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }
  };
}

/**
 * handleApiError — standalone helper for routes that don't use withApiHandler.
 * Returns a structured NextResponse for any caught error.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const messages = error.issues.map((e) => `${(e.path as any[]).join('.')}: ${e.message}`).join('، ');
    return NextResponse.json({ error: `خطأ في البيانات: ${messages}` }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: (error as AppError).message }, { status: (error as AppError).status });
  }
  if ((error as any)?.code && PRISMA_ERRORS[(error as any).code]) {
    const pe = PRISMA_ERRORS[(error as any).code];
    return NextResponse.json({ error: pe.message }, { status: pe.status });
  }
  const msg = error instanceof Error ? error.message : 'حدث خطأ داخلي في الخادم.';
  return NextResponse.json({ error: msg }, { status: 500 });
}
