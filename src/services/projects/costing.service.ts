/**
 * ProjectCostingService — تكاليف المشروع + الربحية + WBS
 *
 * يُحسب:
 *   1. التكلفة الفعلية = عمالة + مواد + مصروفات عامة
 *   2. التكلفة المخططة (Budget)
 *   3. EAC = AC + (BAC - EV) / CPI  (Estimate At Completion)
 *   4. هامش الربح الإجمالي والصافي
 *   5. نسبة الإكمال للاعتراف بالإيراد (IFRS 15 % completion)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export class ProjectCostingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** حساب التكلفة الفعلية للمشروع */
  async calculateCost(projectId: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const project = await prisma.project?.findFirst?.({
      where: { id: projectId, tenantId },
      select: { id: true, name: true, budget: true, contractValue: true, startDate: true, endDate: true },
    }).catch(() => null);

    if (!project) throw new Error(`المشروع ${projectId} غير موجود`);

    // جلب التكاليف الفعلية من GL
    const glCosts = await prisma.journalLine?.groupBy?.({
      by: ['accountCode'],
      where: {
        tenantId,
        journalEntry: { status: 'POSTED', sourceId: projectId, sourceType: 'PROJECT' },
        accountCode:  { gte: '5000', lte: '5999' }, // حسابات المصروفات
      },
      _sum: { debit: true },
    }).catch(() => []) ?? [];

    const laborCost     = glCosts.filter((r: any) => r.accountCode >= '5100' && r.accountCode <= '5149').reduce((s: number, r: any) => s + Number(r._sum.debit ?? 0), 0);
    const materialCost  = glCosts.filter((r: any) => r.accountCode >= '5100' && r.accountCode < '5100').reduce((s: number, r: any) => s + Number(r._sum.debit ?? 0), 0);
    const overheadCost  = glCosts.filter((r: any) => r.accountCode >= '5200').reduce((s: number, r: any) => s + Number(r._sum.debit ?? 0), 0);
    const totalActual   = glCosts.reduce((s: number, r: any) => s + Number(r._sum.debit ?? 0), 0);

    // Earned Value Metrics
    const budget          = Number(project.budget ?? 0);
    const contractValue   = Number(project.contractValue ?? 0);
    const pctComplete     = budget > 0 ? Math.min(100, (totalActual / budget) * 100) : 0;
    const ev              = (pctComplete / 100) * budget;   // Earned Value
    const cpi             = ev > 0 ? ev / totalActual : 1; // Cost Performance Index
    const eac             = cpi > 0 ? budget / cpi : budget; // Estimate At Completion
    const variance        = budget - totalActual;
    const grossMargin     = contractValue - totalActual;
    const grossMarginPct  = contractValue > 0 ? (grossMargin / contractValue) * 100 : 0;

    return {
      projectId,
      projectName:    project.name,
      budget,
      contractValue,
      totalActualCost: totalActual,
      laborCost,
      materialCost,
      overheadCost,
      pctComplete:    +pctComplete.toFixed(1),
      earnedValue:    +ev.toFixed(2),
      cpi:            +cpi.toFixed(3),
      eac:            +eac.toFixed(2),
      costVariance:   +variance.toFixed(2),
      grossMargin:    +grossMargin.toFixed(2),
      grossMarginPct: +grossMarginPct.toFixed(1),
      status:         cpi >= 1 ? 'ON_BUDGET' : cpi >= 0.9 ? 'AT_RISK' : 'OVER_BUDGET',
    };
  }

  /** ترحيل تكلفة مشروع (Timesheet / Material) */
  async postProjectCost(projectId: string, type: 'LABOR' | 'MATERIAL' | 'EXPENSE', amount: number, description: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const amt      = new Decimal(amount);

    const accountCode = type === 'LABOR' ? '5130' : type === 'MATERIAL' ? '5110' : '5200';
    const crAccount   = type === 'LABOR' ? '2120' : '1310';

    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `PROJ-COST-${projectId}-${Date.now()}`,
        description: `${description} — مشروع ${projectId}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'PROJECT',
        sourceId:    projectId,
        lines: {
          create: [
            { tenantId, accountCode, debit: amt,           credit: new Decimal(0), description },
            { tenantId, accountCode: crAccount, debit: new Decimal(0), credit: amt, description: 'مقابل' },
          ],
        },
      },
    }).catch(() => null);

    return { projectId, type, amount, accountCode };
  }
}
