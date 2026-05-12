/**
 * Demand Forecast v2 — Probabilistic Forecasting Engine
 *
 * Provides P50/P90/P99 demand forecasts using:
 *   - Simple Exponential Smoothing (Holt-Winters) for trend+seasonality
 *   - Bootstrap resampling for uncertainty bounds
 *
 * For production-grade, swap with Python sidecar (Prophet/NeuralProphet).
 * This engine is fully self-contained for fast inference & evaluation.
 */

export interface SalesPoint {
  date: Date;
  qty: number;
}

export interface ForecastConfig {
  horizonDays: number;
  alpha?: number; // level smoothing 0..1
  beta?: number;  // trend smoothing
  gamma?: number; // seasonal smoothing
  seasonalPeriod?: number; // days
  bootstrapIterations?: number;
}

export interface ForecastPoint {
  date: Date;
  p50: number;
  p90: number;
  p99: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  productId: string;
  warehouseId: string;
  history: SalesPoint[];
  forecast: ForecastPoint[];
  modelVersion: string;
  mape?: number; // mean absolute percentage error from cross-validation
  fittedAt: Date;
}

const DEFAULTS = {
  alpha: 0.3,
  beta: 0.1,
  gamma: 0.15,
  seasonalPeriod: 7,
  bootstrapIterations: 200,
};

/** Aggregate raw sales movements into daily quantity series. */
export function aggregateDaily(points: { date: Date; qty: number }[]): SalesPoint[] {
  const byDay = new Map<string, number>();
  for (const p of points) {
    const k = p.date.toISOString().slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + p.qty);
  }
  const result: SalesPoint[] = [];
  for (const [k, qty] of byDay.entries()) {
    result.push({ date: new Date(k + 'T00:00:00Z'), qty });
  }
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  // Fill missing days with 0
  if (result.length < 2) return result;
  const filled: SalesPoint[] = [];
  let cursor = new Date(result[0].date);
  const end = new Date(result[result.length - 1].date);
  let idx = 0;
  while (cursor <= end) {
    const k = cursor.toISOString().slice(0, 10);
    if (result[idx] && result[idx].date.toISOString().slice(0, 10) === k) {
      filled.push(result[idx]);
      idx++;
    } else {
      filled.push({ date: new Date(cursor), qty: 0 });
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return filled;
}

/** Holt-Winters triple exponential smoothing fit + forecast. */
function holtWinters(
  series: number[],
  config: Required<ForecastConfig>
): { level: number; trend: number; seasonals: number[]; forecasts: number[]; residuals: number[] } {
  const { alpha, beta, gamma, seasonalPeriod, horizonDays } = config;
  const n = series.length;
  if (n < seasonalPeriod * 2) {
    // Fallback: simple moving average for short series
    const avg = series.reduce((s, x) => s + x, 0) / n;
    return {
      level: avg,
      trend: 0,
      seasonals: new Array(seasonalPeriod).fill(0),
      forecasts: new Array(horizonDays).fill(avg),
      residuals: series.map((x) => x - avg),
    };
  }
  // Initial seasonal indices
  const firstSeasonAvg = series.slice(0, seasonalPeriod).reduce((s, x) => s + x, 0) / seasonalPeriod;
  const secondSeasonAvg = series.slice(seasonalPeriod, 2 * seasonalPeriod).reduce((s, x) => s + x, 0) / seasonalPeriod;
  let level = firstSeasonAvg;
  let trend = (secondSeasonAvg - firstSeasonAvg) / seasonalPeriod;
  const seasonals = new Array(seasonalPeriod).fill(0).map((_, i) => series[i] - firstSeasonAvg);
  const residuals: number[] = [];
  for (let t = 0; t < n; t++) {
    const seasonalIdx = t % seasonalPeriod;
    const prevLevel = level;
    const prevSeasonal = seasonals[seasonalIdx];
    const forecast = prevLevel + trend + prevSeasonal;
    residuals.push(series[t] - forecast);
    level = alpha * (series[t] - prevSeasonal) + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonals[seasonalIdx] = gamma * (series[t] - level) + (1 - gamma) * prevSeasonal;
  }
  const forecasts: number[] = [];
  for (let h = 1; h <= horizonDays; h++) {
    const seasonalIdx = (n + h - 1) % seasonalPeriod;
    forecasts.push(Math.max(0, level + h * trend + seasonals[seasonalIdx]));
  }
  return { level, trend, seasonals, forecasts, residuals };
}

/** Bootstrap residuals to produce probabilistic intervals. */
function bootstrapIntervals(
  baseForecasts: number[],
  residuals: number[],
  iterations: number
): { p50: number[]; p90: number[]; p99: number[]; lower: number[]; upper: number[] } {
  const H = baseForecasts.length;
  const samples: number[][] = new Array(H).fill(0).map(() => []);
  for (let it = 0; it < iterations; it++) {
    for (let h = 0; h < H; h++) {
      const r = residuals[Math.floor(Math.random() * residuals.length)];
      samples[h].push(Math.max(0, baseForecasts[h] + r));
    }
  }
  const quantile = (arr: number[], q: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
    return sorted[idx];
  };
  return {
    p50: samples.map((s) => quantile(s, 0.5)),
    p90: samples.map((s) => quantile(s, 0.9)),
    p99: samples.map((s) => quantile(s, 0.99)),
    lower: samples.map((s) => quantile(s, 0.1)),
    upper: samples.map((s) => quantile(s, 0.95)),
  };
}

export function forecastDemand(
  productId: string,
  warehouseId: string,
  history: SalesPoint[],
  config?: ForecastConfig
): ForecastResult {
  const cfg = { ...DEFAULTS, ...config, horizonDays: config?.horizonDays ?? 30 };
  const series = history.map((p) => p.qty);
  const hw = holtWinters(series, cfg);
  const intervals = bootstrapIntervals(hw.forecasts, hw.residuals, cfg.bootstrapIterations);
  const startDate = history.length
    ? new Date(history[history.length - 1].date.getTime() + 24 * 60 * 60 * 1000)
    : new Date();
  const forecast: ForecastPoint[] = hw.forecasts.map((_, i) => ({
    date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
    p50: intervals.p50[i],
    p90: intervals.p90[i],
    p99: intervals.p99[i],
    lowerBound: intervals.lower[i],
    upperBound: intervals.upper[i],
  }));
  return {
    productId,
    warehouseId,
    history,
    forecast,
    modelVersion: 'hw-bootstrap-1.0',
    mape: computeMAPE(series, hw),
    fittedAt: new Date(),
  };
}

function computeMAPE(series: number[], hw: { residuals: number[] }): number {
  // Mean Absolute Percentage Error on training residuals
  let totalPct = 0;
  let count = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i] === 0) continue;
    totalPct += Math.abs(hw.residuals[i] / series[i]);
    count++;
  }
  return count === 0 ? 0 : (totalPct / count) * 100;
}

/** Compute reorder point + safety stock from forecast. */
export function computeReorderParameters(
  forecast: ForecastResult,
  leadTimeDays: number,
  serviceLevel: 0.9 | 0.95 | 0.99 = 0.95
): { reorderPoint: number; safetyStock: number; expectedDemandDuringLT: number } {
  // Service level mapping to forecast quantile
  const ltForecasts = forecast.forecast.slice(0, leadTimeDays);
  const expectedDemand = ltForecasts.reduce((s, f) => s + f.p50, 0);
  const upperEnvelope = ltForecasts.reduce((s, f) => {
    return s + (serviceLevel === 0.99 ? f.p99 : serviceLevel === 0.95 ? f.p90 : f.p50);
  }, 0);
  const safetyStock = Math.max(0, upperEnvelope - expectedDemand);
  return {
    expectedDemandDuringLT: expectedDemand,
    safetyStock,
    reorderPoint: expectedDemand + safetyStock,
  };
}

/** Economic Order Quantity (EOQ) — square root formula. */
export function computeEOQ(annualDemand: number, orderCost: number, holdingCostPerUnit: number): number {
  if (annualDemand <= 0 || holdingCostPerUnit <= 0) return 0;
  return Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
}

/** Newsvendor formula — for short-shelf-life items. */
export function newsvendorOptimalQty(
  forecast: ForecastResult,
  underageCost: number, // lost margin from stockout
  overageCost: number   // disposal/holding cost from leftover
): number {
  const criticalRatio = underageCost / (underageCost + overageCost);
  const periodForecasts = forecast.forecast.slice(0, 7);
  // Find quantity that matches critical ratio quantile of demand
  const sorted = periodForecasts.map((f) => f.p50).sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(criticalRatio * sorted.length));
  return sorted[idx];
}
