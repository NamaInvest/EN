/**
 * Earned Value Management (EVM) Engine
 *
 * Standard PMI metrics for project performance:
 *   PV  = Planned Value (BCWS - Budgeted Cost of Work Scheduled)
 *   EV  = Earned Value (BCWP - Budgeted Cost of Work Performed)
 *   AC  = Actual Cost (ACWP - Actual Cost of Work Performed)
 *   BAC = Budget at Completion
 *   CPI = Cost Performance Index = EV / AC
 *   SPI = Schedule Performance Index = EV / PV
 *   EAC = Estimate at Completion (multiple methods)
 *   ETC = Estimate to Complete = EAC - AC
 *   VAC = Variance at Completion = BAC - EAC
 *   TCPI = To-Complete Performance Index
 */

export interface ProjectBudgetLine {
  date: Date;       // planned date
  description: string;
  budgetedAmount: number;
}

export interface ProjectMilestone {
  id: string;
  description: string;
  budgetedAmount: number;
  plannedDate: Date;
  percentComplete: number; // 0..1
  actualCompletionDate?: Date;
}

export interface ProjectActualCost {
  date: Date;
  description: string;
  amount: number;
  category: 'LABOR' | 'MATERIAL' | 'EXPENSE' | 'SUBCONTRACTOR' | 'OVERHEAD';
}

export interface EVMSnapshot {
  asOfDate: Date;
  BAC: number;
  PV: number;
  EV: number;
  AC: number;
  CV: number;      // EV - AC (cost variance)
  SV: number;      // EV - PV (schedule variance)
  CPI: number;     // EV / AC
  SPI: number;     // EV / PV
  EAC_classic: number;     // BAC / CPI
  EAC_remaining: number;   // AC + (BAC - EV)
  EAC_atypical: number;    // AC + ((BAC - EV) / (CPI * SPI))
  ETC: number;             // EAC - AC
  VAC: number;             // BAC - EAC
  TCPI: number;            // (BAC - EV) / (BAC - AC)
  percentComplete: number; // EV / BAC
  percentSpent: number;    // AC / BAC
  health: 'GREEN' | 'YELLOW' | 'RED';
  forecastCompletionDate: Date;
}

export interface EVMInputs {
  asOfDate: Date;
  budgetLines: ProjectBudgetLine[];      // planned spending schedule
  milestones: ProjectMilestone[];        // earned value source
  actuals: ProjectActualCost[];
  projectStartDate: Date;
  projectEndDate: Date;
}

export function computeEVM(input: EVMInputs): EVMSnapshot {
  const BAC = input.milestones.reduce((s, m) => s + m.budgetedAmount, 0);
  // PV: cumulative planned through asOf
  const PV = input.budgetLines
    .filter((b) => b.date <= input.asOfDate)
    .reduce((s, b) => s + b.budgetedAmount, 0);
  // EV: budgeted × %complete for each milestone (whether milestone date is past or not)
  const EV = input.milestones.reduce((s, m) => s + m.budgetedAmount * m.percentComplete, 0);
  // AC: cumulative actuals through asOf
  const AC = input.actuals
    .filter((a) => a.date <= input.asOfDate)
    .reduce((s, a) => s + a.amount, 0);
  const CPI = AC === 0 ? 0 : EV / AC;
  const SPI = PV === 0 ? 0 : EV / PV;
  const CV = EV - AC;
  const SV = EV - PV;
  const EAC_classic = CPI === 0 ? BAC : BAC / CPI;
  const EAC_remaining = AC + (BAC - EV);
  const EAC_atypical = CPI === 0 || SPI === 0 ? BAC : AC + (BAC - EV) / (CPI * SPI);
  const ETC = EAC_classic - AC;
  const VAC = BAC - EAC_classic;
  const TCPI = (BAC - AC) === 0 ? 0 : (BAC - EV) / (BAC - AC);
  const percentComplete = BAC === 0 ? 0 : EV / BAC;
  const percentSpent = BAC === 0 ? 0 : AC / BAC;
  // Project health by combined thresholds
  let health: EVMSnapshot['health'] = 'GREEN';
  if (CPI < 0.85 || SPI < 0.85) health = 'RED';
  else if (CPI < 0.95 || SPI < 0.95) health = 'YELLOW';
  // Forecast completion: linear extrapolation of percent complete
  const totalDuration = input.projectEndDate.getTime() - input.projectStartDate.getTime();
  const elapsed = input.asOfDate.getTime() - input.projectStartDate.getTime();
  const projectedTotalDuration = percentComplete === 0 ? totalDuration : elapsed / percentComplete;
  const forecastCompletionDate = new Date(input.projectStartDate.getTime() + projectedTotalDuration);
  return {
    asOfDate: input.asOfDate,
    BAC,
    PV,
    EV,
    AC,
    CV,
    SV,
    CPI,
    SPI,
    EAC_classic,
    EAC_remaining,
    EAC_atypical,
    ETC,
    VAC,
    TCPI,
    percentComplete,
    percentSpent,
    health,
    forecastCompletionDate,
  };
}

/* ---------- S-Curve generation ---------- */

export interface SCurvePoint {
  date: Date;
  cumulativePV: number;
  cumulativeEV: number;
  cumulativeAC: number;
}

export function buildSCurve(input: EVMInputs, periodDays = 7): SCurvePoint[] {
  const points: SCurvePoint[] = [];
  const startMs = input.projectStartDate.getTime();
  const endMs = input.asOfDate.getTime();
  for (let t = startMs; t <= endMs; t += periodDays * 24 * 60 * 60 * 1000) {
    const date = new Date(t);
    const cumulativePV = input.budgetLines
      .filter((b) => b.date <= date)
      .reduce((s, b) => s + b.budgetedAmount, 0);
    const cumulativeEV = input.milestones
      .filter((m) => m.actualCompletionDate && m.actualCompletionDate <= date)
      .reduce((s, m) => s + m.budgetedAmount * m.percentComplete, 0);
    const cumulativeAC = input.actuals
      .filter((a) => a.date <= date)
      .reduce((s, a) => s + a.amount, 0);
    points.push({ date, cumulativePV, cumulativeEV, cumulativeAC });
  }
  return points;
}

/* ---------- Issue Detection ---------- */

export interface EVMIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
}

export function detectEVMIssues(snap: EVMSnapshot): EVMIssue[] {
  const issues: EVMIssue[] = [];
  if (snap.CPI < 0.85) {
    issues.push({
      severity: 'CRITICAL',
      title: 'تجاوز تكلفة كبير (CPI < 0.85)',
      description: `التكلفة المنفذة ${snap.AC.toFixed(0)} أعلى من القيمة المنفذة ${snap.EV.toFixed(0)} (انحراف ${snap.CV.toFixed(0)} SAR).`,
      recommendation: 'مراجعة العقود مع المتعاقدين الفرعيين، ضبط النطاق، طلب CR من العميل.',
    });
  } else if (snap.CPI < 0.95) {
    issues.push({
      severity: 'MEDIUM',
      title: 'تجاوز تكلفة طفيف (CPI 0.85-0.95)',
      description: `CPI = ${snap.CPI.toFixed(2)}. يحتاج مراقبة.`,
      recommendation: 'تتبع لإسبوعين متتاليين قبل اتخاذ إجراء.',
    });
  }
  if (snap.SPI < 0.85) {
    issues.push({
      severity: 'CRITICAL',
      title: 'تأخر جدولي كبير (SPI < 0.85)',
      description: `الإنجاز ${(snap.percentComplete * 100).toFixed(0)}% أقل من المخطط.`,
      recommendation: 'إعادة جدولة، تخصيص موارد إضافية، أو تقليص النطاق.',
    });
  }
  if (snap.TCPI > 1.1) {
    issues.push({
      severity: 'HIGH',
      title: 'الإنجاز المتبقي يتطلب أداء غير واقعي (TCPI > 1.1)',
      description: `يتطلب إنجاز ما تبقى بكفاءة ${snap.TCPI.toFixed(2)} (الواقع الحالي ${snap.CPI.toFixed(2)}).`,
      recommendation: 'يجب إعادة تقدير الـ EAC وإبلاغ أصحاب المصلحة.',
    });
  }
  return issues;
}
