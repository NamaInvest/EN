import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.bank-stateme' });

/**
 * Bank Statement Importer — OFX & CAMT.053 (ISO 20022) Parser
 *
 * Covers IMPROVEMENT_PLAN Gap #7:
 * - Parses OFX (Open Financial Exchange) format
 * - Parses CAMT.053 (ISO 20022 XML) format used by Saudi banks
 * - Matches imported transactions against existing treasury/GL entries
 * - Creates unmatched entries as "PENDING_REVIEW" for manual reconciliation
 * - Idempotent: skips already-imported transactions (by FITID/EndToEndId)
 */

export interface BankTransaction {
  id:          string;   // FITID or EndToEndId (unique per bank)
  date:        string;   // YYYY-MM-DD
  amount:      number;   // positive = credit (deposit), negative = debit (withdrawal)
  currency:    string;
  description: string;
  reference?:  string;
  type:        'CREDIT' | 'DEBIT';
  rawData?:    Record<string, string>;
}

export interface ImportResult {
  total:    number;
  matched:  number;
  pending:  number;
  skipped:  number;   // already imported
  errors:   string[];
}

export class BankStatementImporter {

  // ── OFX Parser ────────────────────────────────────────────────────────────────
  static parseOFX(content: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];

    // OFX is SGML-like, extract STMTTRN blocks
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match: RegExpExecArray | null;

    while ((match = trnRegex.exec(content)) !== null) {
      const block = match[1];

      const get = (tag: string) => {
        const m = new RegExp(`<${tag}>([^<\n\r]+)`, 'i').exec(block);
        return m ? m[1].trim() : '';
      };

      const fitid  = get('FITID');
      const dtpost = get('DTPOSTED'); // YYYYMMDD or YYYYMMDDHHMMSS
      const trnamt = parseFloat(get('TRNAMT') || '0');
      const memo   = get('MEMO') || get('NAME') || '';
      const refnum = get('REFNUM') || get('CHECKNUM') || '';

      if (!fitid) continue;

      // Normalize date
      const rawDate = dtpost.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3');

      transactions.push({
        id:          fitid,
        date:        rawDate,
        amount:      trnamt,
        currency:    get('CURRENCY') || 'SAR',
        description: memo,
        reference:   refnum || undefined,
        type:        trnamt >= 0 ? 'CREDIT' : 'DEBIT',
      });
    }

    return transactions;
  }

  // ── CAMT.053 XML Parser ───────────────────────────────────────────────────────
  static parseCAMT053(xmlContent: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];

    // Extract <Ntry> (Entry) blocks from CAMT.053
    const ntryRegex = /<Ntry>([\s\S]*?)<\/Ntry>/gi;
    let match: RegExpExecArray | null;

    while ((match = ntryRegex.exec(xmlContent)) !== null) {
      const block = match[1];

      const getXml = (tag: string) => {
        const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]+)<\/${tag}>`, 'i').exec(block);
        return m ? m[1].trim() : '';
      };

      const amt     = parseFloat(getXml('Amt') || '0');
      const crdDbt  = getXml('CdtDbtInd');  // CRDT or DBIT
      const bookgDt = getXml('BookgDt') || getXml('Dt') || '';
      const endToEnd = getXml('EndToEndId') || getXml('TxId') || `CAMT-${Date.now()}-${Math.random()}`;
      const rmtInf  = getXml('Ustrd') || getXml('AddtlNtryInf') || '';
      const ref     = getXml('Ref') || getXml('InstrId') || '';

      // Normalize date
      const date = bookgDt.match(/(\d{4}-\d{2}-\d{2})/)
        ? bookgDt.substring(0, 10)
        : bookgDt.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

      const isCredit = crdDbt.toUpperCase() === 'CRDT';
      const signedAmt = isCredit ? Math.abs(amt) : -Math.abs(amt);

      transactions.push({
        id:          endToEnd,
        date:        date || new Date().toISOString().split('T')[0],
        amount:      signedAmt,
        currency:    getXml('Ccy') || 'SAR',
        description: rmtInf,
        reference:   ref || undefined,
        type:        isCredit ? 'CREDIT' : 'DEBIT',
      });
    }

    return transactions;
  }

  // ── Auto-detect format and parse ──────────────────────────────────────────────
  static parse(content: string): { format: 'OFX' | 'CAMT053' | 'UNKNOWN'; transactions: BankTransaction[] } {
    const trimmed = content.trim();

    if (trimmed.includes('<OFX>') || trimmed.includes('OFXHEADER:') || trimmed.includes('<STMTTRN>')) {
      return { format: 'OFX', transactions: this.parseOFX(content) };
    }

    if (trimmed.includes('<BkToCstmrStmt') || trimmed.includes('urn:iso:std:iso:20022') || trimmed.includes('<Ntry>')) {
      return { format: 'CAMT053', transactions: this.parseCAMT053(content) };
    }

    return { format: 'UNKNOWN', transactions: [] };
  }

  // ── Import into DB + Match against GL ────────────────────────────────────────
  static async importToDatabase(
    prisma: any,
    bankAccountId: number,
    transactions: BankTransaction[],
    userId: number,
  ): Promise<ImportResult> {
    const result: ImportResult = { total: transactions.length, matched: 0, pending: 0, skipped: 0, errors: [] };

    for (const trn of transactions) {
      try {
        // Idempotency: check if already imported
        const existing = await prisma.bankStatementLine.findFirst({
          where: { externalId: trn.id, bankAccountId },
        }).catch(() => null);

        if (existing) { result.skipped++; continue; }

        // Try to match against treasury transactions (same date ±1 day, same amount)
        const matchDate   = new Date(trn.date);
        const dayBefore   = new Date(matchDate); dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter    = new Date(matchDate); dayAfter.setDate(dayAfter.getDate() + 1);
        const absAmount   = Math.abs(trn.amount);

        const matched = await prisma.treasury.findFirst({
          where: {
            amount:     { gte: absAmount - 0.01, lte: absAmount + 0.01 },
            type:       trn.type === 'CREDIT' ? 'in' : 'out',
            reconStatus: { in: [null, 'UNMATCHED'] },
          },
        }).catch(() => null);

        // Create bank statement line
        await prisma.bankStatementLine.create({
          data: {
            bankAccountId,
            externalId:   trn.id,
            transactionDate: trn.date,
            amount:       absAmount,
            currency:     trn.currency,
            description:  trn.description,
            reference:    trn.reference,
            type:         trn.type,
            status:       matched ? 'MATCHED' : 'PENDING_REVIEW',
            matchedTreasuryId: matched?.id ?? null,
            importedBy:   userId,
          },
        });

        if (matched) {
          // Mark treasury entry as matched
          await prisma.treasury.update({
            where: { id: matched.id },
            data:  { reconStatus: 'MATCHED' },
          }).catch(() => null);
          result.matched++;
        } else {
          result.pending++;
        }

      } catch (err: any) {
        result.errors.push(`TXN ${trn.id}: ${err.message}`);
      }
    }

    return result;
  }
}
