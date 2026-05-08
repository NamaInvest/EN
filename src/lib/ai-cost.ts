/**
 * AI Cost Dashboard
 * ──────────────────────────────────────────────────────────
 * Tracks token usage, cost per model, and latency for all AI operations.
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'AICost' });

interface UsageRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  feature: string;
  timestamp: Date;
}

const usageHistory: UsageRecord[] = [];
const MAX_HISTORY = 10000;

// Token pricing (SAR per 1M tokens — approximate)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 9.375, output: 37.5 },
  'gpt-4o-mini': { input: 0.5625, output: 2.25 },
  'gpt-3.5-turbo': { input: 1.875, output: 7.5 },
  'gemini-2.0-flash': { input: 0.375, output: 1.5 },
  'gemini-1.5-pro': { input: 13.125, output: 52.5 },
  'claude-3.5-sonnet': { input: 11.25, output: 56.25 },
  default: { input: 3.75, output: 15 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] || PRICING.default;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

export const aiCost = {
  /** Record a usage event */
  track(model: string, inputTokens: number, outputTokens: number, latencyMs: number, feature: string): void {
    const cost = calculateCost(model, inputTokens, outputTokens);
    const record: UsageRecord = { model, inputTokens, outputTokens, cost, latencyMs, feature, timestamp: new Date() };
    usageHistory.push(record);
    if (usageHistory.length > MAX_HISTORY) usageHistory.splice(0, usageHistory.length - MAX_HISTORY);
    log.info(`AI cost: ${model} — ${inputTokens}+${outputTokens} tokens — ${cost.toFixed(4)} SAR — ${feature}`);
  },

  /** Get total cost for a period */
  getTotalCost(since?: Date): { totalCost: number; totalTokens: number; requests: number } {
    const filtered = since ? usageHistory.filter(r => r.timestamp >= since) : usageHistory;
    return {
      totalCost: Math.round(filtered.reduce((s, r) => s + r.cost, 0) * 10000) / 10000,
      totalTokens: filtered.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0),
      requests: filtered.length,
    };
  },

  /** Get cost breakdown by model */
  getByModel(): Record<string, { cost: number; requests: number; avgLatency: number }> {
    const result: Record<string, { cost: number; requests: number; totalLatency: number; avgLatency: number }> = {};
    usageHistory.forEach(r => {
      if (!result[r.model]) result[r.model] = { cost: 0, requests: 0, totalLatency: 0, avgLatency: 0 };
      result[r.model].cost += r.cost;
      result[r.model].requests += 1;
      result[r.model].totalLatency += r.latencyMs;
    });
    Object.values(result).forEach(v => { v.avgLatency = Math.round(v.totalLatency / (v.requests || 1)); });
    return result;
  },

  /** Get cost breakdown by feature */
  getByFeature(): Record<string, { cost: number; requests: number }> {
    const result: Record<string, { cost: number; requests: number }> = {};
    usageHistory.forEach(r => {
      if (!result[r.feature]) result[r.feature] = { cost: 0, requests: 0 };
      result[r.feature].cost += r.cost;
      result[r.feature].requests += 1;
    });
    return result;
  },

  /** Get daily cost for the last N days */
  getDailyCost(days = 30): Record<string, number> {
    const result: Record<string, number> = {};
    const cutoff = new Date(Date.now() - days * 86400000);
    usageHistory.filter(r => r.timestamp >= cutoff).forEach(r => {
      const day = r.timestamp.toISOString().split('T')[0];
      result[day] = (result[day] || 0) + r.cost;
    });
    return result;
  },

  /** Get recent records */
  getRecent(limit = 50): UsageRecord[] {
    return usageHistory.slice(-limit).reverse();
  },
};
