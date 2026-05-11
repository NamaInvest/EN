import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cashflow-direct-engine' });

const DIRECT_CATEGORIES = [
  { category: 'OPERATING', subCategory: 'RECEIPTS_FROM_CUSTOMERS' },
  { category: 'OPERATING', subCategory: 'PAYMENTS_TO_SUPPLIERS' },
  { category: 'OPERATING', subCategory: 'PAYMENTS_TO_EMPLOYEES' },
  { category: 'OPERATING', subCategory: 'TAX_PAID' },
  { category: 'INVESTING', subCategory: 'CAPEX' },
  { category: 'INVESTING', subCategory: 'ASSET_DISPOSALS' },
  { category: 'FINANCING', subCategory: 'LOAN_PROCEEDS' },
  { category: 'FINANCING', subCategory: 'LOAN_REPAYMENTS' },
  { category: 'FINANCING', subCategory: 'DIVIDENDS_PAID' },
];

export class CashflowDirectEngine {
  static async buildStatement(tenantId: string, period: string) {
    log.info(`Building direct cashflow for ${period}`);
    await prisma.cashFlowLine.deleteMany({ where: { tenantId, period, method: 'DIRECT' } });
    const data = DIRECT_CATEGORIES.map(c => ({ tenantId, period, method: 'DIRECT', ...c, amount: 0 }));
    return prisma.cashFlowLine.createMany({ data });
  }

  static async updateLine(tenantId: string, period: string, subCategory: string, amount: number) {
    return prisma.cashFlowLine.updateMany({ where: { tenantId, period, subCategory }, data: { amount } });
  }
}
