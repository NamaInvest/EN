/**
 * Unit Tests — Bank Statement Importer
 * Tests: OFX parsing, CAMT.053 parsing, format detection, idempotency logic
 */

import { BankStatementImporter, BankTransaction } from '../bank-statement-importer';

// ── OFX Parsing ───────────────────────────────────────────────────────────────

const SAMPLE_OFX = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260501
<TRNAMT>15000.00
<FITID>TXN001-2026
<NAME>CUSTOMER PAYMENT</NAME>
<MEMO>REF: INV-2026-001</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260502120000
<TRNAMT>-1500.50
<FITID>TXN002-2026
<NAME>BANK CHARGE</NAME>
<MEMO>MONTHLY MAINTENANCE FEE</MEMO>
<REFNUM>REF-CHRG-001</REFNUM>
</STMTTRN>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const SAMPLE_CAMT = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Ntry>
        <Amt Ccy="SAR">25000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-05-03</Dt></BookgDt>
        <EndToEndId>E2E-ALRAJHI-001</EndToEndId>
        <Ustrd>Payment from Customer ABC</Ustrd>
        <InstrId>REF-2026-PAY-001</InstrId>
      </Ntry>
      <Ntry>
        <Amt Ccy="SAR">500.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-05-04</Dt></BookgDt>
        <EndToEndId>E2E-ALRAJHI-002</EndToEndId>
        <Ustrd>Bank transfer fee</Ustrd>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

describe('BankStatementImporter — OFX Parser', () => {
  let transactions: BankTransaction[];

  beforeAll(() => {
    transactions = BankStatementImporter.parseOFX(SAMPLE_OFX);
  });

  test('parses 2 transactions from OFX', () => {
    expect(transactions).toHaveLength(2);
  });

  test('first transaction: CREDIT, amount +15000', () => {
    expect(transactions[0].type).toBe('CREDIT');
    expect(transactions[0].amount).toBe(15000);
    expect(transactions[0].id).toBe('TXN001-2026');
  });

  test('second transaction: DEBIT, amount -1500.50', () => {
    expect(transactions[1].type).toBe('DEBIT');
    expect(transactions[1].amount).toBe(-1500.50);
    expect(transactions[1].id).toBe('TXN002-2026');
  });

  test('date normalized to YYYY-MM-DD', () => {
    expect(transactions[0].date).toBe('2026-05-01');
    expect(transactions[1].date).toMatch(/^2026-05-02/);
  });

  test('reference captured from REFNUM', () => {
    expect(transactions[1].reference).toBe('REF-CHRG-001');
  });

  test('memo captured correctly', () => {
    expect(transactions[0].description).toBe('REF: INV-2026-001');
  });
});

// ── CAMT.053 Parsing ──────────────────────────────────────────────────────────

describe('BankStatementImporter — CAMT.053 Parser', () => {
  let transactions: BankTransaction[];

  beforeAll(() => {
    transactions = BankStatementImporter.parseCAMT053(SAMPLE_CAMT);
  });

  test('parses 2 transactions from CAMT.053', () => {
    expect(transactions).toHaveLength(2);
  });

  test('CRDT entry → positive amount + CREDIT type', () => {
    expect(transactions[0].type).toBe('CREDIT');
    expect(transactions[0].amount).toBe(25000);
    expect(transactions[0].id).toBe('E2E-ALRAJHI-001');
  });

  test('DBIT entry → negative amount + DEBIT type', () => {
    expect(transactions[1].type).toBe('DEBIT');
    expect(transactions[1].amount).toBe(-500);
  });

  test('date parsed correctly from CAMT Dt element', () => {
    expect(transactions[0].date).toBe('2026-05-03');
    expect(transactions[1].date).toBe('2026-05-04');
  });

  test('currency captured from Ccy attribute', () => {
    expect(transactions[0].currency).toBe('SAR');
  });

  test('remittance info captured from Ustrd', () => {
    expect(transactions[0].description).toBe('Payment from Customer ABC');
  });
});

// ── Auto-format Detection ─────────────────────────────────────────────────────

describe('BankStatementImporter — Format Detection', () => {
  test('OFX content → detected as OFX', () => {
    const { format } = BankStatementImporter.parse(SAMPLE_OFX);
    expect(format).toBe('OFX');
  });

  test('CAMT.053 XML → detected as CAMT053', () => {
    const { format } = BankStatementImporter.parse(SAMPLE_CAMT);
    expect(format).toBe('CAMT053');
  });

  test('random text → detected as UNKNOWN', () => {
    const { format, transactions } = BankStatementImporter.parse('this is not a bank file');
    expect(format).toBe('UNKNOWN');
    expect(transactions).toHaveLength(0);
  });

  test('empty string → UNKNOWN with 0 transactions', () => {
    const { format, transactions } = BankStatementImporter.parse('');
    expect(format).toBe('UNKNOWN');
    expect(transactions).toHaveLength(0);
  });
});

// ── Amount Sign Consistency ───────────────────────────────────────────────────

describe('BankStatementImporter — Amount Sign Rules', () => {
  test('CREDIT transactions always have positive amount', () => {
    const txns = BankStatementImporter.parseOFX(SAMPLE_OFX);
    const credits = txns.filter(t => t.type === 'CREDIT');
    credits.forEach(t => expect(t.amount).toBeGreaterThanOrEqual(0));
  });

  test('DEBIT transactions always have negative amount in OFX', () => {
    const txns = BankStatementImporter.parseOFX(SAMPLE_OFX);
    const debits = txns.filter(t => t.type === 'DEBIT');
    debits.forEach(t => expect(t.amount).toBeLessThan(0));
  });

  test('CAMT DBIT entries have negative amount', () => {
    const txns = BankStatementImporter.parseCAMT053(SAMPLE_CAMT);
    const debits = txns.filter(t => t.type === 'DEBIT');
    debits.forEach(t => expect(t.amount).toBeLessThan(0));
  });
});
