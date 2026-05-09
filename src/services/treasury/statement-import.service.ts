/**
 * Treasury Statement Import Service
 * Imports bank statements (MT940/CSV/OFX) and creates BankStatementLine records
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';

export type FileFormat = 'MT940' | 'CSV' | 'OFX' | 'CAMT053' | 'BAI2';

export interface ParsedTransaction {
  transactionDate: Date;
  valueDate?: Date;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  reference?: string;
  counterpartyName?: string;
  counterpartyIBAN?: string;
}

export interface ImportResult {
  statementId: number;
  bankAccountId: number;
  totalTransactions: number;
  duplicates: number;
  newLines: number;
}

export class StatementImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Import a bank statement with pre-parsed lines
   */
  async importStatement(tenantId: string, data: {
    bankAccountId: number;
    fileFormat: FileFormat;
    fileName: string;
    currency: string;
    openingBalance: number;
    openingDate: Date;
    closingBalance: number;
    closingDate: Date;
    transactions: ParsedTransaction[];
    importedByUserId?: string;
  }): Promise<ImportResult> {
    // Create statement record
    const statement = await this.prisma.bankStatement.create({
      data: {
        tenantId,
        bankAccountId: data.bankAccountId,
        fileFormat: data.fileFormat,
        fileName: data.fileName,
        currency: data.currency,
        openingBalance: new Decimal(data.openingBalance),
        openingDate: data.openingDate,
        closingBalance: new Decimal(data.closingBalance),
        closingDate: data.closingDate,
        importedAt: new Date(),
        importMethod: 'MANUAL',
        importedByUserId: data.importedByUserId,
        totalTransactions: data.transactions.length,
        validationStatus: 'PENDING',
        reconStatus: 'NOT_STARTED',
      },
    });

    let duplicates = 0;
    let newLines = 0;

    for (const tx of data.transactions) {
      const hashInput = `${tx.transactionDate.toISOString()}_${tx.amount}_${tx.reference ?? ''}_${tx.counterpartyIBAN ?? ''}`;
      const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

      // Check for duplicates
      const existing = await this.prisma.bankStatementLine.findFirst({
        where: { tenantId, hash },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      await this.prisma.bankStatementLine.create({
        data: {
          tenantId,
          statementId: statement.id,
          transactionDate: tx.transactionDate,
          valueDate: tx.valueDate,
          amount: new Decimal(tx.amount),
          currency: data.currency,
          type: tx.type,
          description: tx.description,
          reference: tx.reference,
          counterpartyName: tx.counterpartyName,
          counterpartyIBAN: tx.counterpartyIBAN,
          hash,
          matchStatus: 'UNMATCHED',
        },
      });
      newLines++;
    }

    // Validate balance
    const expectedClosing = data.openingBalance + data.transactions
      .reduce((s, t) => s + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);
    const diff = Math.abs(expectedClosing - data.closingBalance);

    await this.prisma.bankStatement.update({
      where: { id: statement.id },
      data: {
        duplicatesCount: duplicates,
        validationStatus: diff > 0.01 ? 'BALANCE_MISMATCH' : 'VALID',
        validationDifference: diff > 0.01 ? new Decimal(diff) : undefined,
      },
    });

    return {
      statementId: statement.id,
      bankAccountId: data.bankAccountId,
      totalTransactions: data.transactions.length,
      duplicates,
      newLines,
    };
  }

  /**
   * Get unmatched lines for reconciliation
   */
  async getUnmatchedLines(tenantId: string, bankAccountId: number): Promise<{
    id: number;
    transactionDate: Date;
    amount: number;
    type: string;
    description: string;
    reference: string | null;
  }[]> {
    const lines = await this.prisma.bankStatementLine.findMany({
      where: {
        tenantId,
        matchStatus: 'UNMATCHED',
        statement: { bankAccountId },
      },
      select: {
        id: true,
        transactionDate: true,
        amount: true,
        type: true,
        description: true,
        reference: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: 200,
    });

    return lines.map((l) => ({ ...l, amount: Number(l.amount) }));
  }

  /**
   * Mark line as matched
   */
  async matchLine(tenantId: string, lineId: number, matchedToType: string, matchedToId: number, strategy: string): Promise<void> {
    await this.prisma.bankStatementLine.update({
      where: { id: lineId },
      data: {
        matchStatus: 'AUTO_MATCHED',
        matchedToType,
        matchedToId,
        matchedAt: new Date(),
        matchStrategy: strategy as any,
      },
    });
  }
}
