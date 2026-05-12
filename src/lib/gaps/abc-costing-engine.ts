/**
 * Activity-Based Costing (ABC) + Time-Driven ABC Engine
 *
 * Allocates overhead costs to products based on activity consumption.
 * Supports both traditional ABC (with cost drivers) and TDABC (with time equations).
 *
 * Use cases:
 *   - More accurate product costing than absorption costing
 *   - Co-product / by-product cost allocation (Physical Qty / Sales Value / NRV methods)
 *   - Backflushing for repetitive manufacturing
 */

export interface ActivityPool {
  id: string;
  name: string;
  totalCost: number;          // total $ accumulated in this pool for the period
  driver: string;             // e.g., "machine_hours", "setup_count", "inspections"
  totalDriverUnits: number;   // total units consumed in the period
}

export interface ActivityRate {
  activityId: string;
  ratePerDriverUnit: number;
}

export function computeActivityRates(pools: ActivityPool[]): ActivityRate[] {
  return pools.map((p) => ({
    activityId: p.id,
    ratePerDriverUnit: p.totalDriverUnits === 0 ? 0 : p.totalCost / p.totalDriverUnits,
  }));
}

export interface ProductActivityConsumption {
  productId: string;
  activityId: string;
  driverConsumed: number;
}

export function allocateActivityCosts(
  consumption: ProductActivityConsumption[],
  rates: ActivityRate[]
): { productId: string; activityId: string; allocatedCost: number }[] {
  const rateMap = new Map(rates.map((r) => [r.activityId, r.ratePerDriverUnit]));
  return consumption.map((c) => ({
    productId: c.productId,
    activityId: c.activityId,
    allocatedCost: c.driverConsumed * (rateMap.get(c.activityId) ?? 0),
  }));
}

export function summarizeProductCosts(
  allocations: { productId: string; activityId: string; allocatedCost: number }[]
): Map<string, { totalCost: number; byActivity: Record<string, number> }> {
  const result = new Map<string, { totalCost: number; byActivity: Record<string, number> }>();
  for (const a of allocations) {
    const cur = result.get(a.productId) ?? { totalCost: 0, byActivity: {} };
    cur.totalCost += a.allocatedCost;
    cur.byActivity[a.activityId] = (cur.byActivity[a.activityId] ?? 0) + a.allocatedCost;
    result.set(a.productId, cur);
  }
  return result;
}

/* ---------- Time-Driven ABC ---------- */

export interface TimeDrivenResource {
  id: string;
  name: string;
  capacityMinutesPerPeriod: number;
  practicalCapacityMinutes: number; // typically 80-85% of theoretical
  costPerPeriod: number;
  costPerMinute: number; // computed
}

export function computeTDABCCost(resource: Omit<TimeDrivenResource, 'costPerMinute'>): TimeDrivenResource {
  return {
    ...resource,
    costPerMinute:
      resource.practicalCapacityMinutes === 0 ? 0 : resource.costPerPeriod / resource.practicalCapacityMinutes,
  };
}

export interface TimeEquation {
  activityId: string;
  resourceId: string;
  // base + Σ(coefficient_i × variable_i)
  formula: { base: number; coefficients: { variable: string; coefficient: number }[] };
}

export function evaluateTimeEquation(
  eq: TimeEquation,
  variables: Record<string, number>
): number {
  let minutes = eq.formula.base;
  for (const c of eq.formula.coefficients) {
    minutes += c.coefficient * (variables[c.variable] ?? 0);
  }
  return Math.max(0, minutes);
}

/* ---------- Joint Product Allocation ---------- */

export type JointAllocationMethod = 'PHYSICAL_QTY' | 'SALES_VALUE' | 'NRV';

export interface JointProduct {
  productId: string;
  qty: number;
  salesValueAtSplitOff?: number;
  netRealizableValue?: number; // sales value - further processing costs
}

export function allocateJointCost(
  totalJointCost: number,
  products: JointProduct[],
  method: JointAllocationMethod
): { productId: string; allocatedCost: number; percentage: number }[] {
  let basisSum = 0;
  const bases: number[] = [];
  for (const p of products) {
    let basis = 0;
    if (method === 'PHYSICAL_QTY') basis = p.qty;
    else if (method === 'SALES_VALUE') basis = p.salesValueAtSplitOff ?? 0;
    else if (method === 'NRV') basis = p.netRealizableValue ?? 0;
    bases.push(basis);
    basisSum += basis;
  }
  if (basisSum === 0) {
    return products.map((p) => ({ productId: p.productId, allocatedCost: 0, percentage: 0 }));
  }
  return products.map((p, i) => {
    const pct = bases[i] / basisSum;
    return {
      productId: p.productId,
      allocatedCost: totalJointCost * pct,
      percentage: pct,
    };
  });
}

/* ---------- Backflushing for Repetitive Manufacturing ---------- */

export interface BillOfMaterialsLine {
  componentId: string;
  qtyPerUnit: number;
  stdCost: number;
}

export interface BackflushResult {
  finishedQty: number;
  scrapQty: number;
  componentConsumption: { componentId: string; qty: number; cost: number }[];
  totalMaterialCost: number;
  totalScrapCost: number;
}

export function backflush(
  bom: BillOfMaterialsLine[],
  finishedQty: number,
  scrapPercent = 0
): BackflushResult {
  const effectiveQty = finishedQty * (1 + scrapPercent);
  const consumption = bom.map((b) => ({
    componentId: b.componentId,
    qty: b.qtyPerUnit * effectiveQty,
    cost: b.qtyPerUnit * effectiveQty * b.stdCost,
  }));
  const totalMaterialCost = consumption.reduce((s, c) => s + c.cost, 0);
  const scrapQty = finishedQty * scrapPercent;
  const totalScrapCost = totalMaterialCost * (scrapPercent / (1 + scrapPercent));
  return {
    finishedQty,
    scrapQty,
    componentConsumption: consumption,
    totalMaterialCost,
    totalScrapCost,
  };
}

/* ---------- Variance Analysis ---------- */

export interface CostVariance {
  type: 'MATERIAL_PRICE' | 'MATERIAL_USAGE' | 'LABOR_RATE' | 'LABOR_EFFICIENCY' | 'OVERHEAD';
  budgetedCost: number;
  actualCost: number;
  variance: number;
  favorable: boolean;
}

export function computeMaterialVariances(input: {
  stdPrice: number;
  actualPrice: number;
  stdQty: number;
  actualQty: number;
}): { priceVariance: CostVariance; usageVariance: CostVariance } {
  const priceVar = (input.stdPrice - input.actualPrice) * input.actualQty;
  const usageVar = (input.stdQty - input.actualQty) * input.stdPrice;
  return {
    priceVariance: {
      type: 'MATERIAL_PRICE',
      budgetedCost: input.stdPrice * input.actualQty,
      actualCost: input.actualPrice * input.actualQty,
      variance: priceVar,
      favorable: priceVar > 0,
    },
    usageVariance: {
      type: 'MATERIAL_USAGE',
      budgetedCost: input.stdQty * input.stdPrice,
      actualCost: input.actualQty * input.stdPrice,
      variance: usageVar,
      favorable: usageVar > 0,
    },
  };
}

export function computeLaborVariances(input: {
  stdRate: number;
  actualRate: number;
  stdHours: number;
  actualHours: number;
}): { rateVariance: CostVariance; efficiencyVariance: CostVariance } {
  const rateVar = (input.stdRate - input.actualRate) * input.actualHours;
  const effVar = (input.stdHours - input.actualHours) * input.stdRate;
  return {
    rateVariance: {
      type: 'LABOR_RATE',
      budgetedCost: input.stdRate * input.actualHours,
      actualCost: input.actualRate * input.actualHours,
      variance: rateVar,
      favorable: rateVar > 0,
    },
    efficiencyVariance: {
      type: 'LABOR_EFFICIENCY',
      budgetedCost: input.stdHours * input.stdRate,
      actualCost: input.actualHours * input.stdRate,
      variance: effVar,
      favorable: effVar > 0,
    },
  };
}
