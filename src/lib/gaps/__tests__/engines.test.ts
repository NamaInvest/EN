/**
 * Unit tests for gap-filling engines.
 * Pure logic tests — no DB. Vitest.
 */

import { describe, it, expect } from 'vitest';
import {
  aggregateDaily,
  forecastDemand,
  computeReorderParameters,
  computeEOQ,
  newsvendorOptimalQty,
  computeEmission,
  summarizeEmissions,
  computeDiversityKPIs,
  EMISSION_FACTORS,
  computeEVM,
  buildSCurve,
  detectEVMIssues,
  computeActivityRates,
  allocateActivityCosts,
  summarizeProductCosts,
  allocateJointCost,
  backflush,
  computeMaterialVariances,
  computeLaborVariances,
  buildCubeSQL,
  explainAnomaly,
} from '../index';
import type { AnomalyFinding } from '../anomaly-detection-engine';

/* ---------- Demand Forecast ---------- */
describe('demand-forecast-v2', () => {
  it('aggregateDaily fills missing days with zero', () => {
    const points = [
      { date: new Date('2026-01-01'), qty: 10 },
      { date: new Date('2026-01-03'), qty: 5 },
    ];
    const filled = aggregateDaily(points);
    expect(filled).toHaveLength(3);
    expect(filled[1].qty).toBe(0);
  });

  it('forecastDemand produces P50/P90/P99 ordered', () => {
    const history = Array.from({ length: 60 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      qty: 10 + Math.sin(i / 7) * 3 + Math.random() * 2,
    }));
    const result = forecastDemand('P1', 'W1', history, { horizonDays: 14 });
    expect(result.forecast).toHaveLength(14);
    for (const f of result.forecast) {
      expect(f.p50).toBeGreaterThanOrEqual(0);
      expect(f.p90).toBeGreaterThanOrEqual(f.p50);
      expect(f.p99).toBeGreaterThanOrEqual(f.p90);
    }
  });

  it('computeReorderParameters increases with service level', () => {
    const history = Array.from({ length: 60 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      qty: 10 + (i % 7),
    }));
    const f = forecastDemand('P1', 'W1', history, { horizonDays: 30 });
    const lt = 7;
    const r90 = computeReorderParameters(f, lt, 0.9);
    const r99 = computeReorderParameters(f, lt, 0.99);
    expect(r99.safetyStock).toBeGreaterThanOrEqual(r90.safetyStock);
    expect(r99.reorderPoint).toBeGreaterThanOrEqual(r90.reorderPoint);
  });

  it('computeEOQ returns 0 for zero demand', () => {
    expect(computeEOQ(0, 50, 5)).toBe(0);
    expect(computeEOQ(1000, 50, 5)).toBeCloseTo(141.42, 1);
  });

  it('newsvendor returns higher qty for high underage cost', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      qty: 10 + i,
    }));
    const f = forecastDemand('P1', 'W1', history, { horizonDays: 7 });
    const lowUnderage = newsvendorOptimalQty(f, 1, 10);
    const highUnderage = newsvendorOptimalQty(f, 10, 1);
    expect(highUnderage).toBeGreaterThanOrEqual(lowUnderage);
  });
});

/* ---------- ESG ---------- */
describe('esg', () => {
  it('computeEmission applies correct factor', () => {
    const log = computeEmission({
      date: new Date(),
      scope: 1,
      factorKey: 'DIESEL_LITER',
      qty: 100,
    });
    expect(log.kgCO2e).toBeCloseTo(268, 0); // 100 × 2.68
    expect(log.factor.source).toBe('DEFRA_2024');
  });

  it('summarizeEmissions splits by scope', () => {
    const logs = [
      computeEmission({ date: new Date(), scope: 1, factorKey: 'DIESEL_LITER', qty: 100 }),
      computeEmission({ date: new Date(), scope: 2, factorKey: 'ELECTRICITY_KWH_SA', qty: 1000 }),
      computeEmission({ date: new Date(), scope: 3, factorKey: 'CATEGORY_GENERAL_GOODS', qty: 50000 }),
    ];
    const summary = summarizeEmissions(logs, { revenue: 1000000, employeeCount: 50 });
    expect(summary.scope1).toBeCloseTo(268, 0);
    expect(summary.scope2).toBeCloseTo(650, 0);
    expect(summary.scope3).toBeCloseTo(22500, 0);
    expect(summary.total).toBeCloseTo(23418, 0);
    expect(summary.intensityPerSAR).toBeGreaterThan(0);
    expect(summary.intensityPerEmployee).toBeGreaterThan(0);
  });

  it('computeDiversityKPIs returns Simpson index', () => {
    const kpis = computeDiversityKPIs({
      date: new Date(),
      totalEmployees: 100,
      female: 30,
      male: 70,
      saudiNationals: 60,
      expats: 40,
      disability: 2,
      nationalities: { SA: 60, IN: 20, EG: 10, PH: 10 },
    });
    expect(kpis.femalePercent).toBe(30);
    expect(kpis.saudizationPercent).toBe(60);
    expect(kpis.diversityIndex).toBeGreaterThan(0);
    expect(kpis.diversityIndex).toBeLessThan(1);
  });

  it('EMISSION_FACTORS Saudi grid value reasonable', () => {
    expect(EMISSION_FACTORS.ELECTRICITY_KWH_SA.kgCO2ePerUnit).toBeGreaterThan(0.5);
    expect(EMISSION_FACTORS.ELECTRICITY_KWH_SA.kgCO2ePerUnit).toBeLessThan(1.0);
  });
});

/* ---------- EVM ---------- */
describe('evm', () => {
  const baseInput = {
    asOfDate: new Date('2026-06-01'),
    projectStartDate: new Date('2026-01-01'),
    projectEndDate: new Date('2026-12-31'),
    budgetLines: [
      { date: new Date('2026-02-01'), description: 'Phase 1', budgetedAmount: 100000 },
      { date: new Date('2026-05-01'), description: 'Phase 2', budgetedAmount: 200000 },
      { date: new Date('2026-08-01'), description: 'Phase 3', budgetedAmount: 300000 },
    ],
    milestones: [
      { id: 'm1', description: 'Phase 1 done', budgetedAmount: 100000, plannedDate: new Date('2026-02-01'), percentComplete: 1.0 },
      { id: 'm2', description: 'Phase 2 done', budgetedAmount: 200000, plannedDate: new Date('2026-05-01'), percentComplete: 0.8 },
      { id: 'm3', description: 'Phase 3 done', budgetedAmount: 300000, plannedDate: new Date('2026-08-01'), percentComplete: 0 },
    ],
    actuals: [
      { date: new Date('2026-02-15'), description: 'Phase 1 labor', amount: 110000, category: 'LABOR' as const },
      { date: new Date('2026-05-15'), description: 'Phase 2 material', amount: 180000, category: 'MATERIAL' as const },
    ],
  };

  it('computes BAC = sum of milestones', () => {
    expect(computeEVM(baseInput).BAC).toBe(600000);
  });

  it('computes EV correctly', () => {
    const snap = computeEVM(baseInput);
    // m1 100%×100K + m2 80%×200K + m3 0 = 260K
    expect(snap.EV).toBe(260000);
  });

  it('computes CPI < 1 when over budget', () => {
    const snap = computeEVM(baseInput);
    // EV=260K, AC=290K, CPI=0.897
    expect(snap.CPI).toBeLessThan(1);
    expect(snap.CPI).toBeCloseTo(260000 / 290000, 3);
  });

  it('detects issues when CPI < 0.85', () => {
    const badInput = {
      ...baseInput,
      actuals: [
        { date: new Date('2026-02-15'), description: '', amount: 500000, category: 'LABOR' as const },
      ],
    };
    const snap = computeEVM(badInput);
    const issues = detectEVMIssues(snap);
    expect(issues.some((i) => i.severity === 'CRITICAL')).toBe(true);
  });

  it('buildSCurve emits weekly points', () => {
    const curve = buildSCurve(baseInput, 30);
    expect(curve.length).toBeGreaterThan(0);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].cumulativePV).toBeGreaterThanOrEqual(curve[i - 1].cumulativePV);
    }
  });
});

/* ---------- ABC Costing ---------- */
describe('abc-costing', () => {
  it('computeActivityRates produces cost per driver unit', () => {
    const pools = [
      { id: 'a1', name: 'Setup', totalCost: 50000, driver: 'setups', totalDriverUnits: 100 },
      { id: 'a2', name: 'Machine', totalCost: 200000, driver: 'machine_hours', totalDriverUnits: 5000 },
    ];
    const rates = computeActivityRates(pools);
    expect(rates[0].ratePerDriverUnit).toBe(500);
    expect(rates[1].ratePerDriverUnit).toBe(40);
  });

  it('allocateActivityCosts × summarize gives per-product total', () => {
    const pools = [
      { id: 'a1', name: 'Setup', totalCost: 50000, driver: 'setups', totalDriverUnits: 100 },
      { id: 'a2', name: 'Machine', totalCost: 200000, driver: 'machine_hours', totalDriverUnits: 5000 },
    ];
    const rates = computeActivityRates(pools);
    const allocs = allocateActivityCosts(
      [
        { productId: 'P1', activityId: 'a1', driverConsumed: 10 },
        { productId: 'P1', activityId: 'a2', driverConsumed: 200 },
        { productId: 'P2', activityId: 'a1', driverConsumed: 5 },
      ],
      rates
    );
    const summary = summarizeProductCosts(allocs);
    expect(summary.get('P1')?.totalCost).toBe(10 * 500 + 200 * 40);
    expect(summary.get('P2')?.totalCost).toBe(5 * 500);
  });

  it('allocateJointCost by SALES_VALUE', () => {
    const result = allocateJointCost(
      100000,
      [
        { productId: 'A', qty: 1000, salesValueAtSplitOff: 80000 },
        { productId: 'B', qty: 500, salesValueAtSplitOff: 20000 },
      ],
      'SALES_VALUE'
    );
    expect(result[0].allocatedCost).toBe(80000);
    expect(result[1].allocatedCost).toBe(20000);
  });

  it('backflush deducts components × qty', () => {
    const r = backflush(
      [
        { componentId: 'c1', qtyPerUnit: 2, stdCost: 5 },
        { componentId: 'c2', qtyPerUnit: 1, stdCost: 10 },
      ],
      100,
      0.05
    );
    // effectiveQty = 105
    expect(r.componentConsumption[0].qty).toBe(210);
    expect(r.totalMaterialCost).toBe(210 * 5 + 105 * 10);
  });

  it('computeMaterialVariances signs are correct', () => {
    // Standard price lower than actual -> unfavorable price variance
    const r = computeMaterialVariances({ stdPrice: 10, actualPrice: 12, stdQty: 100, actualQty: 95 });
    expect(r.priceVariance.variance).toBeLessThan(0);
    expect(r.priceVariance.favorable).toBe(false);
    expect(r.usageVariance.variance).toBeGreaterThan(0);
    expect(r.usageVariance.favorable).toBe(true);
  });

  it('computeLaborVariances signs are correct', () => {
    const r = computeLaborVariances({ stdRate: 50, actualRate: 55, stdHours: 100, actualHours: 110 });
    expect(r.rateVariance.favorable).toBe(false);
    expect(r.efficiencyVariance.favorable).toBe(false);
  });
});

/* ---------- OLAP Cube SQL ---------- */
describe('olap-cube', () => {
  it('builds valid SQL for fact_sales', () => {
    const { sql, params } = buildCubeSQL({
      factTable: 'fact_sales',
      tenantId: 't-1',
      rows: [{ field: 'branch_id' }],
      columns: [{ field: 'month' }],
      measures: [{ field: 'amount', agg: 'SUM' }],
      filters: { year: 2026 },
    });
    expect(sql).toContain('"fact_sales"');
    expect(sql).toContain('GROUP BY "branch_id", "month"');
    expect(params).toContain('t-1');
    expect(params).toContain(2026);
  });

  it('rejects unknown dimension', () => {
    expect(() =>
      buildCubeSQL({
        factTable: 'fact_sales',
        tenantId: 't-1',
        rows: [{ field: 'evil_drop_table' }],
        columns: [],
        measures: [{ field: 'amount', agg: 'SUM' }],
      })
    ).toThrow('not allowed');
  });

  it('rejects SQL injection attempt', () => {
    expect(() =>
      buildCubeSQL({
        factTable: 'fact_sales',
        tenantId: 't-1',
        rows: [{ field: 'branch_id; DROP TABLE foo;' }],
        columns: [],
        measures: [{ field: 'amount', agg: 'SUM' }],
      })
    ).toThrow();
  });
});

/* ---------- Anomaly Explanation ---------- */
describe('anomaly-explanation', () => {
  it('provides Arabic explanation for each detector', () => {
    const finding: AnomalyFinding = {
      detector: 'BENFORD_LAW',
      tenantId: 't',
      entityType: 'JournalLine',
      score: 85,
      severity: 'HIGH',
      title: 't',
      description: 'd',
      evidence: {},
      detectedAt: new Date(),
    };
    const exp = explainAnomaly(finding);
    expect(exp.whyItsSuspicious).toMatch(/بنفورد|قانون/);
    expect(exp.suggestedAction).toBe('investigate');
  });

  it('suggests escalate for SoD violation', () => {
    const f: AnomalyFinding = {
      detector: 'SOD_VIOLATION',
      tenantId: 't',
      entityType: 'JE',
      score: 95,
      severity: 'CRITICAL',
      title: '',
      description: '',
      evidence: {},
      detectedAt: new Date(),
    };
    expect(explainAnomaly(f).suggestedAction).toBe('escalate');
  });

  it('suggests escalate for control account', () => {
    const f: AnomalyFinding = {
      detector: 'MANUAL_TO_CONTROL_ACCOUNT',
      tenantId: 't',
      entityType: 'JL',
      score: 95,
      severity: 'CRITICAL',
      title: '',
      description: '',
      evidence: {},
      detectedAt: new Date(),
    };
    expect(explainAnomaly(f).suggestedAction).toBe('escalate');
  });
});
