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

import { XMLParser } from 'fast-xml-parser';

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
   * Parse CAMT.053 XML content securely using fast-xml-parser.
   * 🛡️ Security Hardening: Regex parsing removed. fast-xml-parser explicitly configured 
   * to ignore external entities and prevent XXE (XML External Entity) attacks.
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
      // إعدادات المحلل لضمان الأمان القصوى ضد هجمات XXE
      // ignoreAttributes: false -> لقراءة خصائص مثل <Amt Ccy="SAR">
      // parseTagValue: true -> لتحويل النصوص إلى قيم فعلية
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseTagValue: true,
        trimValues: true,
      });

      // التحقق من وجود DTD لمنع هجمات XXE بشكل صريح قبل التحليل
      if (xmlContent.includes('<!DOCTYPE') || xmlContent.includes('<!ENTITY')) {
          throw new Error('XXE Vulnerability detected: DTD and External Entities are strictly prohibited.');
      }

      const jsonObj = parser.parse(xmlContent);

      // استخراج جذر المستند (يدعم عدة إصدارات من مساحة الأسماء Namespace)
      const doc = jsonObj.Document || jsonObj['urn:iso:std:iso:20022:tech:xsd:camt.053.001.02']?.Document;
      if (!doc || !doc.BkToCstmrStmt || !doc.BkToCstmrStmt.Stmt) {
          throw new Error('Invalid CAMT.053 XML format: Missing BkToCstmrStmt/Stmt node.');
      }

      // بعض البنوك ترسل كشفاً واحداً، وبعضها يرسل مصفوفة من الكشوفات
      const statements = Array.isArray(doc.BkToCstmrStmt.Stmt) ? doc.BkToCstmrStmt.Stmt : [doc.BkToCstmrStmt.Stmt];

      for (const stmt of statements) {
        // الحساب البنكي
        const iban = stmt.Acct?.Id?.IBAN;
        const otherId = stmt.Acct?.Id?.Othr?.Id;
        if (iban || otherId) result.accountNumber = String(iban || otherId);

        // الأرصدة (الافتتاحي والختامي)
        const balances = Array.isArray(stmt.Bal) ? stmt.Bal : (stmt.Bal ? [stmt.Bal] : []);
        for (const bal of balances) {
            const type = bal.Tp?.CdOrPrtry?.Cd;
            const amt = bal.Amt?.['#text'] || bal.Amt; // يدعم حالة وجود خصائص
            if (type === 'OPBD' && amt !== undefined) result.openingBalance = parseFloat(String(amt));
            if (type === 'CLBD' && amt !== undefined) result.closingBalance = parseFloat(String(amt));
            
            // العملة يمكن استخراجها من خاصية الـ Ccy للرصيد
            const ccy = bal.Amt?.['@_Ccy'];
            if (ccy) result.currency = String(ccy);
        }

        // الحركات (Entries)
        const entries = Array.isArray(stmt.Ntry) ? stmt.Ntry : (stmt.Ntry ? [stmt.Ntry] : []);
        for (const entry of entries) {
            try {
                const amount = parseFloat(String(entry.Amt?.['#text'] || entry.Amt || '0'));
                const isCredit = entry.CdtDbtInd === 'CRDT';
                
                // التواريخ
                const bookgDtStr = entry.BookgDt?.Dt || entry.BookgDt?.DtTm || entry.Dt;
                const valDtStr = entry.ValDt?.Dt || entry.ValDt?.DtTm;
                
                const date = bookgDtStr ? new Date(String(bookgDtStr)) : new Date();
                const valueDate = valDtStr ? new Date(String(valDtStr)) : undefined;

                // التفاصيل (NtryDtls) قد تكون مصفوفة أو كائن
                const detailsArray = Array.isArray(entry.NtryDtls) ? entry.NtryDtls : (entry.NtryDtls ? [entry.NtryDtls] : []);
                
                let description = '';
                let counterpartyName = '';
                let counterpartyIban = '';
                let reference = String(entry.NtryRef || ''); // المرجع الافتراضي
                let transactionCode = String(entry.BkTxCd?.Domn?.Fmly?.Cd || entry.CdtDbtInd || '');

                for (const detail of detailsArray) {
                    const txDtlsArray = Array.isArray(detail.TxDtls) ? detail.TxDtls : (detail.TxDtls ? [detail.TxDtls] : []);
                    for (const tx of txDtlsArray) {
                        // المرجع
                        if (tx.Refs) {
                            reference = String(tx.Refs.EndToEndId || tx.Refs.InstrId || tx.Refs.TxId || reference);
                        }
                        
                        // معلومات الطرف الآخر
                        const party = isCredit ? tx.RltdPties?.Dbtr : tx.RltdPties?.Cdtr;
                        const partyAcct = isCredit ? tx.RltdPties?.DbtrAcct : tx.RltdPties?.CdtrAcct;
                        
                        if (party?.Nm) counterpartyName = String(party.Nm);
                        if (partyAcct?.Id?.IBAN) counterpartyIban = String(partyAcct.Id.IBAN);
                        
                        // الوصف المالي
                        if (tx.RmtInf?.Ustrd) {
                            description += (description ? ' | ' : '') + String(tx.RmtInf.Ustrd);
                        }
                    }
                }

                // إضافة الوصف الإضافي إذا كان الوصف المالي فارغاً
                if (!description) {
                    description = String(entry.AddtlNtryInf || counterpartyName || 'تسوية بنكية');
                }

                result.transactions.push({
                    date,
                    valueDate,
                    description,
                    reference,
                    debit: isCredit ? 0 : amount,
                    credit: isCredit ? amount : 0,
                    counterpartyName: counterpartyName || undefined,
                    counterpartyIban: counterpartyIban || undefined,
                    transactionCode: transactionCode || undefined,
                });
            } catch (entryErr) {
                 result.parseErrors.push(`Entry parse error: ${(entryErr as Error).message}`);
            }
        }
      }
    } catch (e) {
      result.parseErrors.push(`CAMT.053 XML parse error: ${(e as Error).message}`);
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
