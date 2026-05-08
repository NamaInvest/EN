/**
 * AI-14 — Observability Metrics Collector
 * Lightweight OpenTelemetry-compatible metrics for API, DB, and LLM monitoring.
 */

interface Metric {
    name: string;
    type: 'counter' | 'histogram' | 'gauge';
    value: number;
    labels: Record<string, string>;
    timestamp: number;
}

const metrics: Metric[] = [];
const counters = new Map<string, number>();
const gauges = new Map<string, number>();
const histograms = new Map<string, number[]>();

/**
 * Increment a counter metric.
 */
export function incrementCounter(name: string, labels: Record<string, string> = {}, delta: number = 1): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    counters.set(key, (counters.get(key) || 0) + delta);
    metrics.push({ name, type: 'counter', value: delta, labels, timestamp: Date.now() });
}

/**
 * Set a gauge metric (current value).
 */
export function setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    gauges.set(key, value);
}

/**
 * Record a histogram observation (e.g., latency).
 */
export function recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    if (!histograms.has(key)) histograms.set(key, []);
    histograms.get(key)!.push(value);
}

/**
 * Measure async function execution time.
 */
export async function withTiming<T>(
    name: string,
    labels: Record<string, string>,
    fn: () => Promise<T>
): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        recordHistogram(`${name}_duration_ms`, Date.now() - start, { ...labels, status: 'success' });
        incrementCounter(`${name}_total`, { ...labels, status: 'success' });
        return result;
    } catch (err: any) {
        recordHistogram(`${name}_duration_ms`, Date.now() - start, { ...labels, status: 'error' });
        incrementCounter(`${name}_total`, { ...labels, status: 'error' });
        throw err;
    }
}

/**
 * Get percentile from histogram data.
 */
function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

/**
 * Get all metrics summary.
 */
export function getMetricsSummary(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, { count: number; p50: number; p95: number; p99: number; avg: number }>;
} {
    const histSummary: Record<string, any> = {};
    histograms.forEach((values, key) => {
        const avg = values.reduce((s: any, v: any) => s + v, 0) / values.length;
        histSummary[key] = {
            count: values.length,
            p50: percentile(values, 50),
            p95: percentile(values, 95),
            p99: percentile(values, 99),
            avg: Math.round(avg * 100) / 100,
        };
    });

    return {
        counters: Object.fromEntries(counters),
        gauges: Object.fromEntries(gauges),
        histograms: histSummary,
    };
}

// Pre-defined metric helpers
export const apiMetrics = {
    request: (route: string, method: string) => incrementCounter('http_requests', { route, method }),
    latency: (route: string, ms: number) => recordHistogram('http_latency_ms', ms, { route }),
    error: (route: string, status: number) => incrementCounter('http_errors', { route, status: String(status) }),
};

export const llmMetrics = {
    call: (model: string) => incrementCounter('llm_calls', { model }),
    tokens: (model: string, prompt: number, completion: number) => {
        incrementCounter('llm_prompt_tokens', { model }, prompt);
        incrementCounter('llm_completion_tokens', { model }, completion);
    },
    latency: (model: string, ms: number) => recordHistogram('llm_latency_ms', ms, { model }),
};

export const dbMetrics = {
    query: (model: string) => incrementCounter('db_queries', { model }),
    latency: (model: string, ms: number) => recordHistogram('db_latency_ms', ms, { model }),
};
