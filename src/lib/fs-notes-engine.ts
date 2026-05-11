import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'fs-notes-engine' });

const NOTE_TYPES = [
  { noteNumber: 1,  noteType: 'BASIS_OF_PREPARATION' },
  { noteNumber: 2,  noteType: 'ACCOUNTING_POLICIES' },
  { noteNumber: 3,  noteType: 'CRITICAL_ESTIMATES' },
  { noteNumber: 4,  noteType: 'REVENUE_IFRS15' },
  { noteNumber: 5,  noteType: 'COST_OF_SALES' },
  { noteNumber: 6,  noteType: 'OPERATING_EXPENSES' },
  { noteNumber: 7,  noteType: 'FINANCE_COSTS' },
  { noteNumber: 8,  noteType: 'INCOME_TAX_IAS12' },
  { noteNumber: 9,  noteType: 'EARNINGS_PER_SHARE' },
  { noteNumber: 10, noteType: 'PPE' },
  { noteNumber: 11, noteType: 'INTANGIBLES_GOODWILL' },
  { noteNumber: 12, noteType: 'INVESTMENT_PROPERTY' },
  { noteNumber: 13, noteType: 'ROU_ASSETS_IFRS16' },
  { noteNumber: 14, noteType: 'INVENTORY' },
  { noteNumber: 15, noteType: 'TRADE_RECEIVABLES_ECL' },
  { noteNumber: 16, noteType: 'CASH_EQUIVALENTS' },
  { noteNumber: 17, noteType: 'BORROWINGS' },
  { noteNumber: 18, noteType: 'DEFERRED_TAX' },
  { noteNumber: 19, noteType: 'PROVISIONS' },
  { noteNumber: 20, noteType: 'TRADE_PAYABLES' },
  { noteNumber: 21, noteType: 'LEASE_LIABILITIES' },
  { noteNumber: 22, noteType: 'SHARE_CAPITAL' },
  { noteNumber: 23, noteType: 'RESERVES' },
  { noteNumber: 24, noteType: 'RELATED_PARTY' },
  { noteNumber: 25, noteType: 'COMMITMENTS_CONTINGENCIES' },
  { noteNumber: 26, noteType: 'FINANCIAL_RISK_MGMT' },
  { noteNumber: 27, noteType: 'SEGMENT_REPORTING_IFRS8' },
  { noteNumber: 28, noteType: 'SUBSEQUENT_EVENTS' },
  { noteNumber: 29, noteType: 'APPROVAL_OF_FS' },
  { noteNumber: 30, noteType: 'GOING_CONCERN' },
];

export class FsNotesEngine {
  static async generateAllNotes(tenantId: string, period: string) {
    log.info(`Generating ${NOTE_TYPES.length} FS notes for ${period}`);
    await prisma.fsNote.deleteMany({ where: { tenantId, period } });
    const data = NOTE_TYPES.map(n => ({ tenantId, period, ...n, content: { status: 'DRAFT', data: {} } }));
    return prisma.fsNote.createMany({ data });
  }

  static async updateNoteContent(tenantId: string, period: string, noteNumber: number, content: object) {
    return prisma.fsNote.updateMany({ where: { tenantId, period, noteNumber }, data: { content } });
  }
}
