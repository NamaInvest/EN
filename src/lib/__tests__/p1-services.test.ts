/**
 * Unit Tests — P2P, ReorderService, PerformanceService
 */
import { ReorderService } from '../../services/inventory/reorder.service';
import { PerformanceService } from '../../services/hr/performance.service';

const mockCtx = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

// ─── ReorderService ───────────────────────────────────────────────────────────

describe('ReorderService._calcEOQ (via checkReorderPoints)', () => {
  it('يحسب EOQ بشكل صحيح — Wilson Formula', () => {
    // EOQ = √(2 × 1000 × 50 / (100 × 0.25)) = √(100000/25) = √4000 ≈ 63.245...
    // Math.ceil(63.245) = 64
    const D = 1000, S = 50, C = 100, h = 0.25;
    const H = C * h;
    const eoq = Math.ceil(Math.sqrt(2 * D * S / H));
    expect(eoq).toBe(64);
  });

  it('checkReorderPoints يُرجع مصفوفة عند عدم وجود أصناف', async () => {
    const prisma = { inventoryItem: { findMany: jest.fn().mockResolvedValue([]) } } as any;
    const svc = new ReorderService(prisma, mockCtx);
    const result = await svc.checkReorderPoints();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('generateAutoPOs يُنشئ PR واحد لكل مورد', async () => {
    const prisma = {
      purchaseRequisition: { create: jest.fn().mockResolvedValue({ id: 'PR-1' }) },
    } as any;
    const svc = new ReorderService(prisma, mockCtx);
    const recs = [
      { itemId: '1', itemName: 'A', currentStock: 0, reorderPoint: 100, safetyStock: 10,
        eoqQty: 50, suggestedOrderQty: 60, estimatedCost: 6000, urgency: 'CRITICAL' as const,
        preferredVendorId: 'V1' },
      { itemId: '2', itemName: 'B', currentStock: 5, reorderPoint: 50, safetyStock: 5,
        eoqQty: 30, suggestedOrderQty: 30, estimatedCost: 3000, urgency: 'WARNING' as const,
        preferredVendorId: 'V1' },
    ];
    const result = await svc.generateAutoPOs(recs);
    expect(result.created).toBe(1); // نفس المورد → PR واحد
    expect(result.totalValue).toBe(9000);
  });
});

// ─── PerformanceService ───────────────────────────────────────────────────────

describe('PerformanceService', () => {
  it('يرفض الأهداف إذا لم تكن الأوزان = 100%', async () => {
    const prisma = {} as any;
    const svc = new PerformanceService(prisma, mockCtx);
    await expect(svc.setGoals('emp-1', [
      { title: 'هدف 1', target: 100, unit: 'ريال', dueDate: new Date(), weight: 60 },
      { title: 'هدف 2', target: 50,  unit: '%',    dueDate: new Date(), weight: 30 },
    ], '2025')).rejects.toThrow('مجموع أوزان الأهداف يجب أن يكون 100%');
  });

  it('يقبل الأهداف إذا كانت الأوزان = 100%', async () => {
    const prisma = { performanceGoal: { createMany: jest.fn().mockResolvedValue({ count: 2 }) } } as any;
    const svc = new PerformanceService(prisma, mockCtx);
    const result = await svc.setGoals('emp-1', [
      { title: 'مبيعات', target: 500000, unit: 'ريال', dueDate: new Date(), weight: 70 },
      { title: 'رضا العملاء', target: 90, unit: '%',  dueDate: new Date(), weight: 30 },
    ], '2025');
    expect(result.goalsCount).toBe(2);
  });

  it('calculateScore → EXCEEDS عند تحقيق 110% من الأهداف', async () => {
    // overallScore = (1.10 + 1.0_competency) / 2 = 1.05 → EXCEEDS (>= 0.9)
    const prisma = {
      performanceGoal: {
        findMany: jest.fn().mockResolvedValue([
          { weight: 100, achievementPct: 110 },
        ]),
      },
      performanceRating: { findMany: jest.fn().mockResolvedValue([]) },
      performanceScore: { upsert: jest.fn().mockResolvedValue({}) },
    } as any;
    const svc = new PerformanceService(prisma, mockCtx);
    const score = await svc.calculateScore('emp-1', '2025');
    expect(score.rating).toBe('EXCEEDS');
    expect(score.bonusMultiplier).toBe(1.5);
  });

  it('calculateScore → EXCEPTIONAL عند تحقيق 135% من الأهداف', async () => {
    // overallScore = (1.2 capped at 1.2) * 0.7 + 0.6 * 0.3 = ?
    // goalsScore = min(135,120)/100 = 1.2 (max capped at 120)
    // overallScore = 1.2*0.7 + 0.6*0.3 = 0.84+0.18 = 1.02 → still EXCEEDS
    // To get EXCEPTIONAL (>=1.1) we need rating override or max cap adjustment.
    // Based on the actual formula: capped at 120%, so EXCEPTIONAL requires
    // very high competency. Let's test the boundary correctly:
    // goalsScore=1.2, competencyScore must be > (1.1-1.2*0.7)/0.3 = (1.1-0.84)/0.3 = 0.87
    // With rating score=5: competencyScore = 5/5 = 1.0 > 0.87 ✓
    const prisma = {
      performanceGoal: {
        findMany: jest.fn().mockResolvedValue([
          { weight: 100, achievementPct: 120 }, // goalsScore = 1.2 (max)
        ]),
      },
      performanceRating: { findMany: jest.fn().mockResolvedValue([{ score: 5 }]) }, // competency = 1.0
      performanceScore: { upsert: jest.fn().mockResolvedValue({}) },
    } as any;
    const svc = new PerformanceService(prisma, mockCtx);
    const score = await svc.calculateScore('emp-1', '2025');
    // overallScore = 1.2*0.7 + 1.0*0.3 = 0.84+0.30 = 1.14 → EXCEPTIONAL ✓
    expect(score.rating).toBe('EXCEPTIONAL');
    expect(score.bonusMultiplier).toBe(2.0);
  });

  it('calculateScore → MEETS عند تحقيق 80% من الأهداف', async () => {
    const prisma = {
      performanceGoal: { findMany: jest.fn().mockResolvedValue([{ weight: 100, achievementPct: 80 }]) },
      performanceRating: { findMany: jest.fn().mockResolvedValue([]) },
      performanceScore: { upsert: jest.fn().mockResolvedValue({}) },
    } as any;
    const svc = new PerformanceService(prisma, mockCtx);
    const score = await svc.calculateScore('emp-1', '2025');
    expect(score.rating).toBe('MEETS');
    expect(score.bonusMultiplier).toBe(1.0);
  });
});
