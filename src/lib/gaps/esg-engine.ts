/**
 * ESG / Sustainability Engine
 *
 * Computes Scope 1/2/3 emissions and energy/water/waste/diversity KPIs.
 * Saudi Green Initiative + GRI Standards aligned.
 */

export type EmissionScope = 1 | 2 | 3;

export interface EmissionFactor {
  activity: string;
  unit: string;
  kgCO2ePerUnit: number;
  source: 'DEFRA_2024' | 'EPA_2024' | 'SAUDI_NCEC' | 'IPCC_2024';
}

/**
 * Saudi-specific emission factors (NCEC + DEFRA harmonized).
 */
export const EMISSION_FACTORS: Record<string, EmissionFactor> = {
  // Scope 1 — direct
  GASOLINE_LITER: { activity: 'Gasoline (combustion)', unit: 'liter', kgCO2ePerUnit: 2.31, source: 'DEFRA_2024' },
  DIESEL_LITER: { activity: 'Diesel (combustion)', unit: 'liter', kgCO2ePerUnit: 2.68, source: 'DEFRA_2024' },
  NATURAL_GAS_M3: { activity: 'Natural gas', unit: 'm3', kgCO2ePerUnit: 2.04, source: 'DEFRA_2024' },
  LPG_KG: { activity: 'LPG', unit: 'kg', kgCO2ePerUnit: 2.94, source: 'DEFRA_2024' },
  // Scope 2 — purchased
  ELECTRICITY_KWH_SA: {
    activity: 'Saudi grid electricity',
    unit: 'kWh',
    kgCO2ePerUnit: 0.65, // KSA grid intensity 2024
    source: 'SAUDI_NCEC',
  },
  ELECTRICITY_KWH_SOLAR: { activity: 'Solar generated', unit: 'kWh', kgCO2ePerUnit: 0.05, source: 'IPCC_2024' },
  // Scope 3 — indirect (supply chain rough proxies in kgCO2e per SAR spent)
  CATEGORY_FOOD: { activity: 'Food procurement', unit: 'SAR', kgCO2ePerUnit: 0.85, source: 'DEFRA_2024' },
  CATEGORY_GENERAL_GOODS: { activity: 'General goods', unit: 'SAR', kgCO2ePerUnit: 0.45, source: 'DEFRA_2024' },
  CATEGORY_SERVICES: { activity: 'Services', unit: 'SAR', kgCO2ePerUnit: 0.18, source: 'DEFRA_2024' },
  // Business travel
  AIR_TRAVEL_KM_SHORT: { activity: 'Short-haul flight', unit: 'km', kgCO2ePerUnit: 0.158, source: 'DEFRA_2024' },
  AIR_TRAVEL_KM_LONG: { activity: 'Long-haul flight', unit: 'km', kgCO2ePerUnit: 0.195, source: 'DEFRA_2024' },
  // Refrigerant leaks (HFC-134a as proxy)
  REFRIGERANT_HFC134A_KG: { activity: 'HFC-134a leak', unit: 'kg', kgCO2ePerUnit: 1430, source: 'IPCC_2024' },
};

export interface EmissionEntry {
  date: Date;
  scope: EmissionScope;
  factorKey: keyof typeof EMISSION_FACTORS;
  qty: number;
  branchId?: string;
  vendorId?: string;
  productId?: string;
  reference?: string;
}

export interface EmissionLog extends EmissionEntry {
  kgCO2e: number;
  factor: EmissionFactor;
}

export function computeEmission(entry: EmissionEntry): EmissionLog {
  const factor = EMISSION_FACTORS[entry.factorKey];
  if (!factor) throw new Error(`Unknown emission factor: ${entry.factorKey}`);
  return {
    ...entry,
    kgCO2e: entry.qty * factor.kgCO2ePerUnit,
    factor,
  };
}

export interface PeriodEmissionsSummary {
  periodStart: Date;
  periodEnd: Date;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  scope1Breakdown: Record<string, number>;
  scope2Breakdown: Record<string, number>;
  scope3Breakdown: Record<string, number>;
  intensityPerSAR?: number; // total kgCO2e per SAR revenue
  intensityPerEmployee?: number;
}

export function summarizeEmissions(
  logs: EmissionLog[],
  options?: { revenue?: number; employeeCount?: number }
): PeriodEmissionsSummary {
  const summary: PeriodEmissionsSummary = {
    periodStart: logs.length ? new Date(Math.min(...logs.map((l) => l.date.getTime()))) : new Date(),
    periodEnd: logs.length ? new Date(Math.max(...logs.map((l) => l.date.getTime()))) : new Date(),
    scope1: 0,
    scope2: 0,
    scope3: 0,
    total: 0,
    scope1Breakdown: {},
    scope2Breakdown: {},
    scope3Breakdown: {},
  };
  for (const l of logs) {
    summary.total += l.kgCO2e;
    if (l.scope === 1) {
      summary.scope1 += l.kgCO2e;
      summary.scope1Breakdown[l.factor.activity] = (summary.scope1Breakdown[l.factor.activity] ?? 0) + l.kgCO2e;
    } else if (l.scope === 2) {
      summary.scope2 += l.kgCO2e;
      summary.scope2Breakdown[l.factor.activity] = (summary.scope2Breakdown[l.factor.activity] ?? 0) + l.kgCO2e;
    } else {
      summary.scope3 += l.kgCO2e;
      summary.scope3Breakdown[l.factor.activity] = (summary.scope3Breakdown[l.factor.activity] ?? 0) + l.kgCO2e;
    }
  }
  if (options?.revenue && options.revenue > 0) {
    summary.intensityPerSAR = summary.total / options.revenue;
  }
  if (options?.employeeCount && options.employeeCount > 0) {
    summary.intensityPerEmployee = summary.total / options.employeeCount;
  }
  return summary;
}

/* ---------- Diversity / Social KPIs ---------- */

export interface DiversitySnapshot {
  date: Date;
  totalEmployees: number;
  female: number;
  male: number;
  saudiNationals: number;
  expats: number;
  disability: number;
  nationalities: Record<string, number>;
}

export interface DiversityKPIs {
  femalePercent: number;
  saudizationPercent: number;
  diversityIndex: number; // Simpson's diversity index for nationalities (0=monoculture, 1=fully diverse)
  disabilityIncluded: number; // count
}

export function computeDiversityKPIs(snap: DiversitySnapshot): DiversityKPIs {
  const femalePercent = (snap.female / snap.totalEmployees) * 100;
  const saudizationPercent = (snap.saudiNationals / snap.totalEmployees) * 100;
  // Simpson's index: 1 - Σ(p_i^2)
  const totalNat = Object.values(snap.nationalities).reduce((s, c) => s + c, 0) || 1;
  const simpson =
    1 -
    Object.values(snap.nationalities).reduce((s, c) => {
      const p = c / totalNat;
      return s + p * p;
    }, 0);
  return {
    femalePercent,
    saudizationPercent,
    diversityIndex: simpson,
    disabilityIncluded: snap.disability,
  };
}

/* ---------- Sustainability Goals ---------- */

export interface SustainabilityGoal {
  kpi: 'EMISSIONS_TOTAL' | 'EMISSIONS_INTENSITY' | 'ENERGY_RENEWABLE_PERCENT' | 'WATER_USE' | 'WASTE_RECYCLED_PERCENT' | 'FEMALE_PERCENT' | 'SAUDIZATION_PERCENT';
  targetValue: number;
  targetDate: Date;
  baselineValue: number;
  baselineDate: Date;
  unit: string;
}

export function progressTowardGoal(
  current: number,
  goal: SustainabilityGoal
): { progressPercent: number; onTrack: boolean; gapToClose: number } {
  const totalChange = goal.targetValue - goal.baselineValue;
  const actualChange = current - goal.baselineValue;
  const progressPercent = totalChange === 0 ? 100 : (actualChange / totalChange) * 100;
  // Time-based on-track check
  const totalTime = goal.targetDate.getTime() - goal.baselineDate.getTime();
  const elapsedTime = Date.now() - goal.baselineDate.getTime();
  const expectedProgress = totalTime === 0 ? 100 : (elapsedTime / totalTime) * 100;
  return {
    progressPercent,
    onTrack: progressPercent >= expectedProgress,
    gapToClose: goal.targetValue - current,
  };
}

/* ---------- Saudi Green Initiative reporter ---------- */

export interface SGIReport {
  organizationName: string;
  periodStart: Date;
  periodEnd: Date;
  emissions: PeriodEmissionsSummary;
  reductionVsBaseline: number; // %
  initiatives: { name: string; impactKgCO2e: number }[];
  certifications: string[];
}

export function buildSGIReport(input: {
  organizationName: string;
  emissions: PeriodEmissionsSummary;
  baselineEmissions: number;
  initiatives?: { name: string; impactKgCO2e: number }[];
  certifications?: string[];
}): SGIReport {
  const reduction =
    input.baselineEmissions > 0
      ? ((input.baselineEmissions - input.emissions.total) / input.baselineEmissions) * 100
      : 0;
  return {
    organizationName: input.organizationName,
    periodStart: input.emissions.periodStart,
    periodEnd: input.emissions.periodEnd,
    emissions: input.emissions,
    reductionVsBaseline: reduction,
    initiatives: input.initiatives ?? [],
    certifications: input.certifications ?? [],
  };
}
