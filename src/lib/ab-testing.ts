/**
 * A/B Testing Engine for AI Prompts
 * ──────────────────────────────────────────────────────────
 * Simple framework to route traffic between different prompt versions
 * and track which one performs better (e.g., lower latency, higher resolution rate).
 */

import { logger } from './logger';

const log = logger.child({ route: 'ABTesting' });

interface Experiment {
  id: string;
  name: string;
  variants: {
    id: string;
    weight: number; // 0-100
    payload: any;
  }[];
  active: boolean;
}

interface TrackRecord {
  experimentId: string;
  variantId: string;
  latencyMs: number;
  success: boolean;
  score?: number;
  timestamp: Date;
}

const experiments = new Map<string, Experiment>();
const trackingLogs: TrackRecord[] = [];

export const abTesting = {
  createExperiment(id: string, name: string, variants: { id: string; weight: number; payload: any }[]) {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      log.warn(`Experiment ${id} weights sum to ${totalWeight}, normalizing to 100.`);
      variants = variants.map(v => ({ ...v, weight: (v.weight / totalWeight) * 100 }));
    }
    experiments.set(id, { id, name, variants, active: true });
  },

  getVariant(experimentId: string): { id: string; payload: any } | null {
    const exp = experiments.get(experimentId);
    if (!exp || !exp.active) return null;

    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const variant of exp.variants) {
      cumulative += variant.weight;
      if (rand <= cumulative) {
        return { id: variant.id, payload: variant.payload };
      }
    }
    return { id: exp.variants[0].id, payload: exp.variants[0].payload };
  },

  trackResult(experimentId: string, variantId: string, success: boolean, latencyMs: number, score?: number) {
    trackingLogs.push({ experimentId, variantId, success, latencyMs, score, timestamp: new Date() });
    if (trackingLogs.length > 10000) trackingLogs.shift();
  },

  getResults(experimentId: string) {
    const logs = trackingLogs.filter(l => l.experimentId === experimentId);
    const results: Record<string, { total: number; successRate: number; avgLatency: number; avgScore: number }> = {};
    
    logs.forEach(l => {
      if (!results[l.variantId]) results[l.variantId] = { total: 0, successRate: 0, avgLatency: 0, avgScore: 0 };
      results[l.variantId].total++;
      if (l.success) results[l.variantId].successRate++;
      results[l.variantId].avgLatency += l.latencyMs;
      if (l.score) results[l.variantId].avgScore += l.score;
    });

    for (const variant in results) {
      const v = results[variant];
      if (v.total > 0) {
        v.successRate = (v.successRate / v.total) * 100;
        v.avgLatency = v.avgLatency / v.total;
        v.avgScore = v.avgScore / v.total;
      }
    }

    return results;
  }
};
