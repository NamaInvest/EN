/**
 * Sentry Error Tracking Integration
 * ────────────────────────────────────────────────────────────────────────────
 * Captures unhandled errors in:
 *   - Server-side API routes (via captureException)
 *   - Background workers / queue jobs
 *   - Structured logger integration (auto-capture on log.error)
 *
 * Usage:
 *   import { captureError, captureMessage, setUserContext } from '@/lib/sentry';
 *   captureError(err, { route: 'sales/POST', tenantId });
 */

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sentry' });

// ── Types ───────────────────────────────────────────────────────────────────
interface SentryContext {
  route?:    string;
  tenantId?: string;
  userId?:   string | number;
  action?:   string;
  extra?:    Record<string, unknown>;
}

// ── Lazy Sentry init (avoids import cost if DSN not configured) ─────────────
let _sentry: typeof import('@sentry/nextjs') | null = null;
let _initAttempted = false;

async function getSentry() {
  if (_initAttempted) return _sentry;
  _initAttempted = true;

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;

  try {
    _sentry = await import('@sentry/nextjs');
    // Only init if not already initialized by next.js instrumentation
    if (!(_sentry as any).getCurrentHub?.().getClient?.()) {
      _sentry.init({
        dsn,
        environment:     process.env.NODE_ENV ?? 'production',
        release:         process.env.npm_package_version ?? '0.0.0',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 0.1,
        // Ignore non-actionable errors
        ignoreErrors: [
          'AbortError',
          'NEXT_NOT_FOUND',
          'NEXT_REDIRECT',
          /^fetch failed/,
        ],
        beforeSend(event) {
          // Strip PII from breadcrumbs
          if (event.breadcrumbs?.values) {
            const vals = Array.from(event.breadcrumbs.values as unknown as any[]);
            event.breadcrumbs.values = vals.map((b: any) => ({
              ...b,
              message: b.message?.replace(/password[=:]\S+/gi, 'password=[REDACTED]'),
            })) as any;
          }
          return event;
        },
      });
    }
    log.info('Sentry initialized', { dsn: dsn.slice(0, 30) + '...' });
    return _sentry;
  } catch (e: any) {
    log.warn('Sentry init failed (package may not be installed)', { msg: e.message });
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Capture an error with structured context.
 * Falls back to structured logger if Sentry is not configured.
 */
export async function captureError(
  error: unknown,
  context: SentryContext = {}
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log locally
  log.error('Captured error', {
    message: err.message,
    stack:   err.stack?.split('\n')[1]?.trim(),
    ...context,
  });

  const sentry = await getSentry();
  if (!sentry) return;

  sentry.withScope(scope => {
    if (context.route)    scope.setTag('route',    context.route);
    if (context.tenantId) scope.setTag('tenantId', context.tenantId);
    if (context.action)   scope.setTag('action',   context.action);
    if (context.userId)   scope.setUser({ id: String(context.userId) });
    if (context.extra)    scope.setExtras(context.extra);
    sentry.captureException(err);
  });
}

/**
 * Capture a non-fatal message (warning/info level).
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context: SentryContext = {}
): Promise<void> {
  log.info(`[Sentry] ${message}`, context);

  const sentry = await getSentry();
  if (!sentry) return;

  sentry.withScope(scope => {
    if (context.tenantId) scope.setTag('tenantId', context.tenantId);
    if (context.route)    scope.setTag('route',    context.route);
    sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for current request scope.
 * Call this after auth validation in withRoute handlers.
 */
export function setUserContext(userId: string | number, tenantId?: string) {
  getSentry().then(sentry => {
    if (!sentry) return;
    sentry.setUser({ id: String(userId), tenant: tenantId });
  });
}

/**
 * Wrap a function with Sentry performance tracing.
 */
export async function withSentrySpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>
): Promise<T> {
  const sentry = await getSentry();
  if (!sentry) return fn();

  return sentry.startSpan({ name, op }, () => fn());
}

// Re-export for convenience (no-op if Sentry not available)
export const Sentry = {
  captureError,
  captureMessage,
  setUserContext,
  withSentrySpan,
};

export default Sentry;
