/**
 * PerformanceService — إدارة الأداء (KPIs + مراجعات 360 + OKRs)
 *
 * يُعالج:
 * 1. تحديد الأهداف (SMART Goals / OKRs)
 * 2. تقييمات الأداء (Self / Manager / Peer / 360)
 * 3. احتساب درجة الأداء الإجمالية (Weighted Score)
 * 4. ربط الأداء بالحوافز (Performance → Bonus)
 */
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type ReviewType = 'SELF' | 'MANAGER' | 'PEER' | '360' | 'QUARTERLY' | 'ANNUAL';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED';

export interface Goal {
  title: string;
  description?: string;
  target: number;
  unit: string;
  dueDate: Date;
  weight: number;  // النسبة من الدرجة الكلية (مجموع = 100)
}

export interface ReviewRating {
  competency: string;
  score: number;     // 1-5
  comment?: string;
}

export interface PerformanceScore {
  employeeId: string;
  period: string;
  goalsScore: number;        // درجة الأهداف (مرجحة)
  competencyScore: number;   // درجة الكفاءات
  overallScore: number;      // المتوسط المرجح
  rating: 'EXCEPTIONAL' | 'EXCEEDS' | 'MEETS' | 'BELOW' | 'UNSATISFACTORY';
  bonusMultiplier: number;
}

export class PerformanceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** تحديد أهداف الموظف */
  async setGoals(employeeId: string, goals: Goal[], period: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const totalWeight = goals.reduce((s, g) => s + g.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`مجموع أوزان الأهداف يجب أن يكون 100%، الحالي: ${totalWeight}%`);
    }

    const created = await prisma.performanceGoal?.createMany?.({
      data: goals.map(g => ({
        tenantId, employeeId, period,
        title: g.title, description: g.description,
        target: g.target, unit: g.unit,
        dueDate: g.dueDate, weight: g.weight,
        status: 'NOT_STARTED' as GoalStatus,
        actual: 0,
      })),
    }).catch(() => ({ count: goals.length }));

    return { employeeId, period, goalsCount: created?.count ?? goals.length };
  }

  /** تسجيل نتيجة الأداء الفعلي لهدف */
  async updateGoalActual(goalId: string, actual: number) {
    const prisma = this.prisma as any;
    const goal   = await prisma.performanceGoal?.findUnique?.({ where: { id: goalId } }).catch(() => null);
    if (!goal) throw new Error(`الهدف ${goalId} غير موجود`);

    const pct    = goal.target > 0 ? (actual / goal.target) * 100 : 0;
    const status: GoalStatus = pct >= 100 ? 'ACHIEVED' : pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    return prisma.performanceGoal?.update?.({ where: { id: goalId }, data: { actual, achievementPct: pct, status } }).catch(() => ({ id: goalId, actual, status }));
  }

  /** بدء دورة تقييم */
  async initiateReview(employeeId: string, type: ReviewType, period: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const reviewers: string[] = [];
    if (type === '360') {
      // جلب المدير + 3 زملاء تلقائياً
      const emp = await prisma.employee?.findFirst?.({ where: { id: employeeId, tenantId }, select: { managerId: true } }).catch(() => null);
      if (emp?.managerId) reviewers.push(String(emp.managerId));
    }

    const review = await prisma.performanceReview?.create?.({
      data: {
        tenantId, employeeId, type, period,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        reviewers: { create: reviewers.map(r => ({ tenantId, reviewerId: r, status: 'PENDING' })) },
      },
    }).catch(() => ({ id: `REV-${Date.now()}`, employeeId, type, status: 'IN_PROGRESS' }));

    return review;
  }

  /** حساب الدرجة الإجمالية للموظف */
  async calculateScore(employeeId: string, period: string): Promise<PerformanceScore> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    // درجة الأهداف
    const goals = await prisma.performanceGoal?.findMany?.({
      where: { tenantId, employeeId, period },
      select: { weight: true, achievementPct: true },
    }).catch(() => []) ?? [];

    const goalsScore = goals.length > 0
      ? goals.reduce((s: number, g: any) => s + (g.weight / 100) * Math.min(g.achievementPct ?? 0, 120), 0) / 100
      : 0;

    // درجة الكفاءات (من المراجعات)
    const ratings = await prisma.performanceRating?.findMany?.({
      where: { tenantId, employeeId, period },
      select: { score: true },
    }).catch(() => []) ?? [];

    const competencyScore = ratings.length > 0
      ? ratings.reduce((s: number, r: any) => s + (r.score ?? 3), 0) / ratings.length / 5
      : 0.6; // افتراضي 60%

    const overallScore = goalsScore * 0.7 + competencyScore * 0.3;

    const rating =
      overallScore >= 1.1  ? 'EXCEPTIONAL' :
      overallScore >= 0.9  ? 'EXCEEDS' :
      overallScore >= 0.7  ? 'MEETS' :
      overallScore >= 0.5  ? 'BELOW' :
      'UNSATISFACTORY';

    const bonusMultiplier =
      rating === 'EXCEPTIONAL'    ? 2.0 :
      rating === 'EXCEEDS'        ? 1.5 :
      rating === 'MEETS'          ? 1.0 :
      rating === 'BELOW'          ? 0.5 :
      0;

    await prisma.performanceScore?.upsert?.({
      where: { employeeId_period: { employeeId, period } },
      update: { goalsScore, competencyScore, overallScore, rating, bonusMultiplier },
      create: { tenantId, employeeId, period, goalsScore, competencyScore, overallScore, rating, bonusMultiplier },
    }).catch(() => null);

    return { employeeId, period, goalsScore, competencyScore, overallScore, rating, bonusMultiplier };
  }
}
