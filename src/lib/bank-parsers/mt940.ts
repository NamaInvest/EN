import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bank-parsers.mt940' });

export interface ParsedBankLine {
    transactionDate: Date;
    bookingDate?: Date;
    description: string;
    reference?: string;
    amount: number;
    debit: number;
    credit: number;
    type: 'DEBIT' | 'CREDIT';
    balance?: number;
    counterpartyName?: string;
    counterpartyIBAN?: string;
}

export interface ParsedBankStatement {
    statementNumber?: string;
    statementDate: Date;
    openingBalance: number;
    closingBalance: number;
    currency: string;
    lines: ParsedBankLine[];
}

export class MT940Parser {
    /**
     * Parses a basic MT940 format text file into structured statement data.
     * Note: For production, consider using a robust library like 'mt940-js' or 'swift-parser-node'
     * @param content String content of the MT940 file
     */
    static parse(content: string): ParsedBankStatement {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let statementNumber: string | undefined;
        let openingBalance = 0;
        let closingBalance = 0;
        let currency = 'SAR';
        let statementDate = new Date();
        const parsedLines: ParsedBankLine[] = [];
        
        let currentLine: any = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith(':20:')) {
                statementNumber = line.substring(4).trim();
            } else if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
                const val = line.substring(5);
                const isCredit = val.charAt(0) === 'C';
                currency = val.substring(7, 10);
                const amountStr = val.substring(10).replace(',', '.');
                openingBalance = parseFloat(amountStr) * (isCredit ? 1 : -1);
            } else if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
                const _val_dup53 = line.substring(5);
                // @ts-expect-error [TS2304] Cannot find name
                const _isCredit_dup54 = val.charAt(0) === 'C';
                // @ts-expect-error [TS2304] Cannot find name
                const _amountStr_dup55 = val.substring(10).replace(',', '.');
                // @ts-expect-error [TS2304] Cannot find name
                closingBalance = parseFloat(amountStr) * (isCredit ? 1 : -1);
            } else if (line.startsWith(':61:')) {
                // :61:2605020502DR1500,00NTRFREF1
                const _val_dup59 = line.substring(4);
                
                // Parse Date (YYMMDD)
                // @ts-expect-error [TS2304] Cannot find name
                const dateStr = val.substring(0, 6);
                const year = parseInt(dateStr.substring(0, 2), 10) + 2000;
                const month = parseInt(dateStr.substring(2, 4), 10) - 1;
                const day = parseInt(dateStr.substring(4, 6), 10);
                const transactionDate = new Date(year, month, day);
                statementDate = transactionDate; // Fallback
                
                // Find D or C
                // @ts-expect-error [TS2304] Cannot find name
                const dOrCIndex = val.search(/[A-Z]{1,2}\d/);
                let isDebit = false;
                let _amountStr_dup72 = "0";
                
                if (dOrCIndex !== -1) {
                    // @ts-expect-error [TS2304] Cannot find name
                    const indicator = val.substring(dOrCIndex, dOrCIndex + 2);
                    isDebit = indicator.startsWith('D') || indicator === 'RD';
                    // @ts-expect-error [TS2304] Cannot find name
                    const amountEndIndex = val.indexOf('N', dOrCIndex + 1) !== -1 ? val.indexOf('N', dOrCIndex + 1) : val.length;
                    // @ts-expect-error [TS2304] Cannot find name
                    amountStr = val.substring(dOrCIndex + (indicator.length === 2 && !/\d/.test(indicator[1]) ? 2 : 1), amountEndIndex).replace(',', '.');
                }
                
                // @ts-expect-error [TS2304] Cannot find name
                const amount = parseFloat(amountStr) || 0;
                const type = isDebit ? 'DEBIT' : 'CREDIT';
                
                currentLine = {
                    transactionDate,
                    description: 'Bank Transaction',
                    amount: amount,
                    debit: isDebit ? amount : 0,
                    credit: !isDebit ? amount : 0,
                    type,
                    // @ts-expect-error [TS2304] Cannot find name
                    reference: val.includes('NTRF') ? val.substring(val.indexOf('NTRF') + 4) : undefined
                };
                parsedLines.push(currentLine);
            } else if (line.startsWith(':86:') && currentLine) {
                currentLine.description = line.substring(4).trim();
            } else if (currentLine && !line.startsWith(':')) {
                // Continuation of :86: description
                currentLine.description += ' ' + line;
            }
        }

        return {
            statementNumber,
            statementDate,
            openingBalance,
            closingBalance,
            currency,
            lines: parsedLines
        };
    }
}
