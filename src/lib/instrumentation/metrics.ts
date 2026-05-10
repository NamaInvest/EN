import { logger } from '@/lib/logger';

const log = logger.child({ service: 'instrumentation.metrics' });

/**
 * Prometheus Metrics — P5.12 (Lightweight, no external dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure TypeScript Prometheus-compatible metrics.
 * Exposes: /api/metrics in Prometheus text format 0.0.4
 *
 * Metrics tracked:
 *   - http_requests_total (counter, by method + status + route)
 *   - http_request_duration_seconds (histogram)
 *   - journal_entries_posted_total (counter, by tenant)
 *   - webhook_deliveries_total (counter, by event + status)
 *   - llm_tokens_consumed_total (counter, by model)
 *   - api_key_requests_total (counter, by key_id)
 *   - approval_requests_total (counter, by status)
 *   - process_uptime_seconds (gauge)
 *   - nodejs_heap_used_bytes (gauge)
 */

// ── Core metric types ─────────────────────────────────────────────────────────

interface LabelSet { [key: string]: string | number }

class Counter {
  private values = new Map<string, number>();
  constructor(public readonly name: string, public readonly help: string, public readonly labelNames: string[] = []) {}

  inc(labels: LabelSet = {}, by = 1) {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + by);
  }

  toPrometheus(): string {
    const lines = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} counter`,
    ];
    for (const [labelStr, value] of this.values.entries()) {
      lines.push(`${this.name}${labelStr} ${value}`);
    }
    return lines.join('\n');
  }

  private labelKey(labels: LabelSet): string {
    if (!this.labelNames.length) return '';
    const parts = this.labelNames
      .filter(n => labels[n] !== undefined)
      .map(n => `${n}="${String(labels[n]).replace(/"/g, '\\"')}"`);
    return parts.length ? `{${parts.join(',')}}` : '';
  }
}

class Gauge {
  private values = new Map<string, number>();
  constructor(public readonly name: string, public readonly help: string, public readonly labelNames: string[] = []) {}

  set(labels: LabelSet, value: number) {
    this.values.set(this.labelKey(labels), value);
  }
  inc(labels: LabelSet = {}, by = 1) {
    const k = this.labelKey(labels);
    this.values.set(k, (this.values.get(k) ?? 0) + by);
  }
  dec(labels: LabelSet = {}, by = 1) {
    const k = this.labelKey(labels);
    this.values.set(k, (this.values.get(k) ?? 0) - by);
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const [labelStr, value] of this.values.entries()) {
      lines.push(`${this.name}${labelStr} ${value}`);
    }
    return lines.join('\n');
  }

  private labelKey(labels: LabelSet): string {
    if (!this.labelNames.length) return '';
    const parts = Object.entries(labels).map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`);
    return parts.length ? `{${parts.join(',')}}` : '';
  }
}

class Histogram {
  private buckets: number[];
  private counts  = new Map<string, number[]>();
  private sums    = new Map<string, number>();
  private totals  = new Map<string, number>();
  private readonly defaultBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[] = [],
    buckets?: number[]
  ) {
    this.buckets = (buckets ?? this.defaultBuckets).sort((a, b) => a - b);
  }

  observe(labels: LabelSet, value: number) {
    const key = this.labelKey(labels);
    const cnt = this.counts.get(key) ?? new Array(this.buckets.length).fill(0);
    const sum = this.sums.get(key) ?? 0;
    const tot = this.totals.get(key) ?? 0;

    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) cnt[i]++;
    }
    this.counts.set(key, cnt);
    this.sums.set(key, sum + value);
    this.totals.set(key, tot + 1);
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [labelStr, cnts] of this.counts.entries()) {
      const baseLbl = labelStr.replace(/\}$/, '');
      let cumulativeCount = 0;
      for (let i = 0; i < this.buckets.length; i++) {
        cumulativeCount += cnts[i];
        const lbl = baseLbl ? `${baseLbl},le="${this.buckets[i]}"}` : `{le="${this.buckets[i]}"}`;
        lines.push(`${this.name}_bucket${lbl} ${cumulativeCount}`);
      }
      const infLbl = baseLbl ? `${baseLbl},le="+Inf"}` : `{le="+Inf"}`;
      lines.push(`${this.name}_bucket${infLbl} ${this.totals.get(labelStr) ?? 0}`);
      lines.push(`${this.name}_sum${labelStr} ${this.sums.get(labelStr) ?? 0}`);
      lines.push(`${this.name}_count${labelStr} ${this.totals.get(labelStr) ?? 0}`);
    }
    return lines.join('\n');
  }

  private labelKey(labels: LabelSet): string {
    if (!this.labelNames.length) return '';
    const parts = this.labelNames
      .filter(n => labels[n] !== undefined)
      .map(n => `${n}="${String(labels[n]).replace(/"/g, '\\"')}"`);
    return parts.length ? `{${parts.join(',')}}` : '';
  }
}

// ── Metric Definitions ────────────────────────────────────────────────────────

export const httpRequestsTotal = new Counter(
  'http_requests_total',
  'Total HTTP requests',
  ['method', 'status', 'route']
);

export const httpRequestDuration = new Histogram(
  'http_request_duration_seconds',
  'HTTP request duration in seconds',
  ['method', 'route'],
  [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
);

export const journalEntriesPosted = new Counter(
  'journal_entries_posted_total',
  'Total journal entries posted',
  ['tenant', 'type']
);

export const webhookDeliveries = new Counter(
  'webhook_deliveries_total',
  'Total webhook delivery attempts',
  ['event', 'status']
);

export const llmTokensConsumed = new Counter(
  'llm_tokens_consumed_total',
  'Total LLM tokens consumed',
  ['model', 'operation']
);

export const apiKeyRequests = new Counter(
  'api_key_requests_total',
  'Total requests by API key',
  ['key_id', 'tenant']
);

export const approvalRequests = new Counter(
  'approval_requests_total',
  'Total approval workflow events',
  ['status', 'document_type']
);

export const activeWebhookSubs = new Gauge(
  'active_webhook_subscriptions',
  'Currently active webhook subscriptions',
  ['tenant']
);

export const idempotencyHits = new Counter(
  'idempotency_cache_hits_total',
  'Idempotency cache hits (replayed responses)',
  ['tenant']
);

const processUptimeGauge = new Gauge('process_uptime_seconds', 'Process uptime in seconds');
const heapUsedGauge      = new Gauge('nodejs_heap_used_bytes', 'V8 heap used in bytes');
const heapTotalGauge     = new Gauge('nodejs_heap_total_bytes', 'V8 heap total in bytes');

// ── Registry ──────────────────────────────────────────────────────────────────
const allMetrics = [
  httpRequestsTotal, httpRequestDuration, journalEntriesPosted,
  webhookDeliveries, llmTokensConsumed, apiKeyRequests, approvalRequests,
  activeWebhookSubs, idempotencyHits,
  processUptimeGauge, heapUsedGauge, heapTotalGauge,
];

export const register = {
  contentType: 'text/plain; version=0.0.4; charset=utf-8',
  metrics: async (): Promise<string> => {
    // Update runtime gauges
    processUptimeGauge.set({}, process.uptime());
    const mem = process.memoryUsage();
    heapUsedGauge.set({},  mem.heapUsed);
    heapTotalGauge.set({}, mem.heapTotal);

    return allMetrics.map(m => m.toPrometheus()).join('\n\n') + '\n';
  },
};
