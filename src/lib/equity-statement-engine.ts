import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'equity-statement-engine' });

export class EquityStatementEngine {
  static async generate(tenantId: string, period: string, layer = 'BOOK') {
    log.info(`Generating equity statement for ${period} layer=${layer}`);
    const existing = await prisma.equityStatementLine.findMany({ where: { tenantId, period, layer } });
    if (existing.length) return existing;
    // Build skeleton rows
    const rows = ['OPENING_BALANCE','TOTAL_COMPREHENSIVE_INCOME','DIVIDENDS','SHARE_ISSUANCE','CLOSING_BALANCE'];
    const cols = ['SHARE_CAPITAL','RETAINED_EARNINGS','REVALUATION_RESERVE','OCI','TOTAL'];
    const lines = [];
    for (const row of rows) {
      for (const col of cols) {
        lines.push({ tenantId, period, layer, row, column: col, amount: 0 });
      }
    }
    return prisma.equityStatementLine.createMany({ data: lines });
  }
}
