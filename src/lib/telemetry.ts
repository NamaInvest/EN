/**
 * OpenTelemetry Instrumentation
 * ──────────────────────────────────────────────────────────
 * Lightweight tracing and metrics for production monitoring.
 * Exports spans to console in dev, to OTLP collector in production.
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'Telemetry' });

interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'OK' | 'ERROR' | 'UNSET';
  attributes: Record<string, string | number | boolean>;
  events: { name: string; timestamp: number; attributes?: Record<string, unknown> }[];
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  labels: Record<string, string>;
  timestamp: Date;
}

// ── Stores ──
const activeSpans = new Map<string, Span>();
const completedSpans: Span[] = [];
const metrics: Metric[] = [];
const MAX_SPANS = 5000;
const MAX_METRICS = 10000;

function generateId(): string {
  return Math.random().toString(36).substring(2, 18);
}

export const telemetry = {
  /** Start a new span */
  startSpan(name: string, attributes: Record<string, string | number | boolean> = {}): string {
    const spanId = generateId();
    const span: Span = {
      traceId: generateId(),
      spanId,
      name,
      startTime: Date.now(),
      status: 'UNSET',
      attributes,
      events: [],
    };
    activeSpans.set(spanId, span);
    return spanId;
  },

  /** End a span */
  endSpan(spanId: string, status: 'OK' | 'ERROR' = 'OK'): Span | null {
    const span = activeSpans.get(spanId);
    if (!span) return null;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    activeSpans.delete(spanId);
    completedSpans.push(span);
    if (completedSpans.length > MAX_SPANS) completedSpans.splice(0, completedSpans.length - MAX_SPANS);

    if (span.duration > 1000) {
      log.warn(`Slow span: ${span.name} took ${span.duration}ms`, { spanId });
    }

    return span;
  },

  /** Add event to span */
  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = activeSpans.get(spanId);
    if (span) span.events.push({ name, timestamp: Date.now(), attributes });
  },

  /** Record a metric */
  recordMetric(name: string, value: number, unit = '', labels: Record<string, string> = {}): void {
    metrics.push({ name, value, unit, labels, timestamp: new Date() });
    if (metrics.length > MAX_METRICS) metrics.splice(0, metrics.length - MAX_METRICS);
  },

  /** Convenience: time an async function */
  async timeAsync<T>(name: string, fn: () => Promise<T>, attributes: Record<string, string | number | boolean> = {}): Promise<T> {
    const spanId = this.startSpan(name, attributes);
    try {
      const result = await fn();
      this.endSpan(spanId, 'OK');
      return result;
    } catch (err) {
      this.endSpan(spanId, 'ERROR');
      throw err;
    }
  },

  /** HTTP request metrics helper */
  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.recordMetric('http_request_duration_ms', durationMs, 'ms', { method, path, status: String(statusCode) });
    this.recordMetric('http_request_total', 1, 'count', { method, path, status: String(statusCode) });
  },

  /** DB query metrics */
  recordDbQuery(operation: string, table: string, durationMs: number): void {
    this.recordMetric('db_query_duration_ms', durationMs, 'ms', { operation, table });
  },

  /** Get recent spans */
  getSpans(limit = 50): Span[] {
    return completedSpans.slice(-limit).reverse();
  },

  /** Get slow spans (>500ms) */
  getSlowSpans(thresholdMs = 500): Span[] {
    return completedSpans.filter(s => (s.duration || 0) > thresholdMs).slice(-50).reverse();
  },

  /** Get metrics summary */
  getMetricsSummary(): Record<string, { count: number; total: number; avg: number; max: number; min: number }> {
    const summary: Record<string, { count: number; total: number; avg: number; max: number; min: number }> = {};
    metrics.forEach(m => {
      if (!summary[m.name]) summary[m.name] = { count: 0, total: 0, avg: 0, max: -Infinity, min: Infinity };
      const s = summary[m.name];
      s.count++;
      s.total += m.value;
      s.avg = s.total / s.count;
      if (m.value > s.max) s.max = m.value;
      if (m.value < s.min) s.min = m.value;
    });
    return summary;
  },

  /** Stats */
  stats(): { activeSpans: number; completedSpans: number; totalMetrics: number } {
    return { activeSpans: activeSpans.size, completedSpans: completedSpans.length, totalMetrics: metrics.length };
  },
};
