/**
 * Bank Statement Import Engine (B.1-B.3)
 * ══════════════════════════════════════════════════════
 * Parsers for:
 *   - MT940 (SWIFT — البنك الأهلي، الراجحي، SABB, Riyad)
 *   - CAMT.053 (ISO 20022 XML — البنوك الخليجية الحديثة)
 *   - OFX / QFX (Open Financial Exchange)
 *   - CSV with configurable column mapping
 *
 * Output: unified BankTransaction[] for Reconciliation Engine
 */

export interface ParsedBankTransaction {
  date: Date;
  valueDate?: Date;
  description: string;
  reference: string;
  debit: number;           // خصم من الحساب
  credit: number;          // إضافة للحساب
  balance?: number;        // الرصيد بعد الحركة
  transactionCode?: string; // SWIFT code e.g. 'TRF', 'RTI', 'CHG'
  counterpartyName?: string;
  counterpartyIban?: string;
  rawLine?: string;
}

export interface ParseResult {
  accountNumber?: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  statementDate?: Date;
  transactions: ParsedBankTransaction[];
  parseErrors: string[];
}

// ═══════════════════════════════════════════════════════════════
// MT940 Parser (SWIFT)
// ═══════════════════════════════════════════════════════════════

export class MT940Parser {

  /**
   * Parse MT940 text content
   * Format used by: البنك الأهلي، الراجحي، SABB، بنك الرياض، سامبا
   */
  static parse(content: string): ParseResult {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const result: ParseResult = {
      currency: 'SAR',
      openingBalance: 0,
      closingBalance: 0,
      transactions: [],
      parseErrors: [],
    };

    let currentTx: Partial<ParsedBankTransaction> | null = null;
    let descriptionBuffer = '';

    const flushTx = () => {
      if (currentTx && (currentTx.debit || currentTx.credit)) {
        result.transactions.push({
          date: currentTx.date || new Date(),
          valueDate: currentTx.valueDate,
          description: descriptionBuffer.trim() || currentTx.description || '',
          reference: currentTx.reference || '',
          debit: currentTx.debit || 0,
          credit: currentTx.credit || 0,
          balance: currentTx.balance,
          transactionCode: currentTx.transactionCode,
          rawLine: currentTx.rawLine,
        });
      }
      currentTx = null;
      descriptionBuffer = '';
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // :25: Account number
      if (line.startsWith(':25:')) {
        result.accountNumber = line.replace(':25:', '').trim();
        continue;
      }

      // :28C: Statement number
      if (line.startsWith(':28C:')) continue;

      // :60F: Opening balance — :60F:C240101SAR100000,00
      if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
        const m = line.match(/:60[FM]:([CD])(\d{6})([A-Z]{3})([\d,]+)/);
        if (m) {
          result.currency = m[3];
          const amt = parseFloat(m[4].replace(',', '.'));
          result.openingBalance = m[1] === 'C' ? amt : -amt;
        }
        continue;
      }

      // :62F: Closing balance
      if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
        const m = line.match(/:62[FM]:([CD])(\d{6})([A-Z]{3})([\d,]+)/);
        if (m) {
          const amt = parseFloat(m[4].replace(',', '.'));
          result.closingBalance = m[1] === 'C' ? amt : -amt;
        }
        continue;
      }

      // :61: Transaction line
      // Format: :61:YYMMDD[MMDD]CRD[amount]NTRN[ref]
      if (line.startsWith(':61:')) {
        flushTx();
        const body = line.replace(':61:', '');
        // Date: first 6 chars YYMMDD
        const dateStr = body.substring(0, 6);
        const year  = 2000 + parseInt(dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const day   = parseInt(dateStr.substring(4, 6));
        const txDate = new Date(year, month, day);

        // Find D/C indicator
        const dcMatch = body.match(/(\d{6})(\d{4})?([CD]R?[SD]?)(\d+,\d+)(N.*)?/);
        if (dcMatch) {
          const isCredit = dcMatch[3].startsWith('C');
          const amount   = parseFloat(dcMatch[4].replace(',', '.'));
          const refPart  = (dcMatch[5] || '').replace(/^N\w{3}/, '').trim();

          currentTx = {
            date: txDate,
            debit:  isCredit ? 0 : amount,
            credit: isCredit ? amount : 0,
            reference: refPart.split('/')[0] || '',
            transactionCode: dcMatch[3],
            rawLine: line,
          };
        } else {
          result.parseErrors.push(`Could not parse :61: line: ${line.substring(0, 60)}`);
        }
        continue;
      }

      // :86: Description / narrative
      if (line.startsWith(':86:')) {
        descriptionBuffer = line.replace(':86:', '').trim();
        continue;
      }

      // Continuation of :86:
      if (currentTx && !line.startsWith(':')) {
        descriptionBuffer += ' ' + line;
      }
    }

    flushTx(); // flush last transaction

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════
// CAMT.053 Parser (ISO 20022 XML)
// ═══════════════════════════════════════════════════════════════

export class CAMT053Parser {

  /**
   * Parse CAMT.053 XML content
   * ISO 20022 standard — used by modern GCC banks
   */
  static parse(xmlContent: string): ParseResult {
    const result: ParseResult = {
      currency: 'SAR',
      openingBalance: 0,
      closingBalance: 0,
      transactions: [],
      parseErrors: [],
    };

    try {
      // Simple regex-based parsing (no DOM dependency)
      // Currency
      const ccy = xmlContent.match(/<Ccy>([A-Z]{3})<\/Ccy>/)?.[1] || 'SAR';
      result.currency = ccy;

      // Account
      result.accountNumber = xmlContent.match(/<IBAN>([^<]+)<\/IBAN>/)?.[1]
        ?? xmlContent.match(/<Id><Othr><Id>([^<]+)<\/Id>/)?.[1];

      // Opening balance
      const opnAmt = xmlContent.match(/<Tp><CdOrPrtry><Cd>OPBD<\/Cd>[\s\S]*?<Amt[^>]*>([\d.]+)<\/Amt>/)?.[1];
      if (opnAmt) result.openingBalance = parseFloat(opnAmt);

      // Closing balance
      const clsAmt = xmlContent.match(/<Tp><CdOrPrtry><Cd>CLBD<\/Cd>[\s\S]*?<Amt[^>]*>([\d.]+)<\/Amt>/)?.[1];
      if (clsAmt) result.closingBalance = parseFloat(clsAmt);

      // Extract all <Ntry> (entry) blocks
      const entryBlocks = xmlContent.match(/<Ntry>([\s\S]*?)<\/Ntry>/g) || [];

      for (const block of entryBlocks) {
        try {
          const amtMatch = block.match(/<Amt[^>]*>([\d.]+)<\/Amt>/);
          const cdtDbtInd = block.match(/<CdtDbtInd>([A-Z]+)<\/CdtDbtInd>/)?.[1];
          // Booking date — try structured path first, then fallback to bare <Dt>
          const bookgDt =
            block.match(/<BookgDt>[\.\s\S]*?<Dt>([^<]+)<\/Dt>/)?.[1]
            ?? block.match(/<BookgDt>[\s\S]*?<Dt>([^<]+)<\/Dt>/)?.[1]
            ?? block.match(/<Dt>([^<]+)<\/Dt>/)?.[1];

          // Value date (settlement date)
          const valDt =
            block.match(/<ValDt>[\s\S]*?<Dt>([^<]+)<\/Dt>/)?.[1]
            ?? block.match(/<ValDt>[\s\S]*?<DtTm>([^<]+)<\/DtTm>/)?.[1];

          // End-to-End reference, then fallback to Instruction ID or generic Ref
          const ref =
            block.match(/<EndToEndId>([^<]+)<\/EndToEndId>/)?.[1]
            ?? block.match(/<InstrId>([^<]+)<\/InstrId>/)?.[1]
            ?? block.match(/<Ref>([^<]+)<\/Ref>/)?.[1]
            ?? '';

          // Counterparty name (creditor or debtor depending on flow)
          const name =
            block.match(/<Cdtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/)?.[1]
            ?? block.match(/<Dbtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/)?.[1]
            ?? block.match(/<Nm>([^<]+)<\/Nm>/)?.[1]
            ?? '';

          // Counterparty IBAN
          const iban =
            block.match(/<CdtrAcct>[\s\S]*?<IBAN>([^<]+)<\/IBAN>/)?.[1]
            ?? block.match(/<DbtrAcct>[\s\S]*?<IBAN>([^<]+)<\/IBAN>/)?.[1]
            ?? block.match(/<IBAN>([^<]+)<\/IBAN>/)?.[1]
            ?? '';

          // Counterparty BIC
          const bic =
            block.match(/<CdtrAgt>[\s\S]*?<BICFi>([^<]+)<\/BICFi>/)?.[1]
            ?? block.match(/<DbtrAgt>[\s\S]*?<BICFi>([^<]+)<\/BICFi>/)?.[1]
            ?? '';

          // Description — unstructured remittance info, then additional entry info
          const desc =
            block.match(/<RmtInf>[\s\S]*?<Ustrd>([^<]+)<\/Ustrd>/)?.[1]
            ?? block.match(/<AddtlNtryInf>([^<]+)<\/AddtlNtryInf>/)?.[1]
            ?? block.match(/<AddtlTxInf>([^<]+)<\/AddtlTxInf>/)?.[1]
            ?? name;

          if (!amtMatch) continue;
          const amount = parseFloat(amtMatch[1]);
          const isCredit = cdtDbtInd === 'CRDT';

          result.transactions.push({
            date:              bookgDt ? new Date(bookgDt) : new Date(),
            valueDate:         valDt ? new Date(valDt) : undefined,
            description:       desc || '',
            reference:         ref,
            debit:             isCredit ? 0 : amount,
            credit:            isCredit ? amount : 0,
            counterpartyName:  name || undefined,
            counterpartyIban:  iban || undefined,
            // bic stored in transactionCode slot for now
            transactionCode:   bic || cdtDbtInd || undefined,
          });
        } catch (e) {
          result.parseErrors.push(`Entry parse error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      result.parseErrors.push(`CAMT.053 parse error: ${(e as Error).message}`);
    }

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════
// CSV Parser (Configurable column mapping)
// ═══════════════════════════════════════════════════════════════

export interface CSVColumnMap {
  date: number;
  description: number;
  debit?: number;
  credit?: number;
  amount?: number;         // single amount column (positive=credit, negative=debit)
  balance?: number;
  reference?: number;
  delimiter?: string;      // default: ','
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  skipRows?: number;       // header rows to skip
}

export class CSVBankParser {

  static parse(csvContent: string, columnMap: CSVColumnMap): ParseResult {
    const result: ParseResult = {
      currency: 'SAR',
      openingBalance: 0,
      closingBalance: 0,
      transactions: [],
      parseErrors: [],
    };

    const delimiter = columnMap.delimiter || ',';
    const lines = csvContent.replace(/\r\n/g, '\n').split('\n');
    const skipRows = columnMap.skipRows ?? 1;

    for (let i = skipRows; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted CSV fields
      const cols = this.parseCSVLine(line, delimiter);

      try {
        const dateStr = cols[columnMap.date]?.trim();
        if (!dateStr) continue;

        const date = this.parseDate(dateStr, columnMap.dateFormat || 'DD/MM/YYYY');
        if (!date) {
          result.parseErrors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
          continue;
        }

        let debit = 0;
        let credit = 0;

        if (columnMap.amount !== undefined) {
          const amt = parseFloat((cols[columnMap.amount] || '0').replace(/[,\s]/g, ''));
          if (amt < 0) debit = Math.abs(amt);
          else credit = amt;
        } else {
          debit  = parseFloat((cols[columnMap.debit  ?? -1] || '0').replace(/[,\s]/g, '')) || 0;
          credit = parseFloat((cols[columnMap.credit ?? -1] || '0').replace(/[,\s]/g, '')) || 0;
        }

        const balance = columnMap.balance !== undefined
          ? parseFloat((cols[columnMap.balance] || '0').replace(/[,\s]/g, '')) || undefined
          : undefined;

        result.transactions.push({
          date,
          description: cols[columnMap.description]?.trim() || '',
          reference:   columnMap.reference !== undefined ? (cols[columnMap.reference]?.trim() || '') : '',
          debit,
          credit,
          balance,
          rawLine: line,
        });
      } catch (e) {
        result.parseErrors.push(`Row ${i + 1}: ${(e as Error).message}`);
      }
    }

    if (result.transactions.length > 0) {
      result.openingBalance = result.transactions[0].balance
        ? result.transactions[0].balance - result.transactions[0].credit + result.transactions[0].debit
        : 0;
      result.closingBalance = result.transactions[result.transactions.length - 1].balance || 0;
    }

    return result;
  }

  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  private static parseDate(str: string, fmt: string): Date | null {
    try {
      const clean = str.replace(/['"]/g, '').trim();
      if (fmt === 'DD/MM/YYYY') {
        const [d, m, y] = clean.split('/');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
      if (fmt === 'MM/DD/YYYY') {
        const [m, d, y] = clean.split('/');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
      return new Date(clean); // ISO
    } catch {
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Auto-detect format and dispatch
// ═══════════════════════════════════════════════════════════════

export type StatementFormat = 'MT940' | 'CAMT053' | 'CSV' | 'OFX';

export function detectFormat(content: string): StatementFormat {
  const s = content.substring(0, 500).trim();
  if (s.startsWith(':20:') || s.includes(':61:'))    return 'MT940';
  if (s.startsWith('<?xml') && s.includes('CAMT'))   return 'CAMT053';
  if (s.startsWith('<?xml') && s.includes('OFX'))    return 'OFX';
  if (s.includes('<OFX>'))                            return 'OFX';
  return 'CSV';
}

export function parseBankStatement(
  content: string,
  format?: StatementFormat,
  csvColumnMap?: CSVColumnMap
): ParseResult {
  const fmt = format || detectFormat(content);

  switch (fmt) {
    case 'MT940':   return MT940Parser.parse(content);
    case 'CAMT053': return CAMT053Parser.parse(content);
    case 'CSV':     return CSVBankParser.parse(content, csvColumnMap || {
      date: 0, description: 1, debit: 2, credit: 3, balance: 4,
      delimiter: ',', dateFormat: 'DD/MM/YYYY', skipRows: 1,
    });
    default:
      return { currency: 'SAR', openingBalance: 0, closingBalance: 0,
               transactions: [], parseErrors: [`Unsupported format: ${fmt}`] };
  }
}
