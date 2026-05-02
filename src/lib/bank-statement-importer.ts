// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BankStatementImporter {
    
    /**
     * Parse MT940 or CSV and store to DB
     */
    static async importStatement(bankAccountId: number, fileFormat: string, fileName: string, fileContent: string, userId: number): Promise<any> {
        let parsedLines: any[] = [];
        let openingBalance = 0;
        let closingBalance = 0;
        let statementNumber = `STMT-${Date.now()}`;
        let statementDate = new Date();

        if (fileFormat === 'MT940') {
            // Very simplified MT940 parser for demonstration
            // Real MT940 has strict tags :61: for lines, :60F: for opening, :62F: for closing
            const lines = fileContent.split('\n');
            let currentLine: any = {};
            
            for (const line of lines) {
                if (line.startsWith(':20:')) statementNumber = line.substring(4).trim();
                else if (line.startsWith(':60F:')) {
                    // :60F:C260501SAR1000000,00
                    const amtStr = line.substring(14).replace(',', '.');
                    openingBalance = parseFloat(amtStr);
                }
                else if (line.startsWith(':62F:')) {
                    const amtStr = line.substring(14).replace(',', '.');
                    closingBalance = parseFloat(amtStr);
                }
                else if (line.startsWith(':61:')) {
                    // :61:2605020502DR1500,00NTRFREF1
                    const isDebit = line.includes('DR') || line.includes('D');
                    const parts = line.split(/[A-Z]{1,2}/);
                    const amtStr = (parts.length > 1 ? parts[1].split('N')[0] : '0').replace(',', '.');
                    const amt = parseFloat(amtStr);
                    
                    currentLine = {
                        valueDate: new Date(),
                        bookingDate: new Date(),
                        debit: isDebit ? amt : 0,
                        credit: !isDebit ? amt : 0,
                        description: '',
                        reference: ''
                    };
                }
                else if (line.startsWith(':86:')) {
                    if (currentLine) {
                        currentLine.description = line.substring(4).trim();
                        parsedLines.push(currentLine);
                        currentLine = null;
                    }
                }
            }
        } else if (fileFormat === 'CSV') {
            // Simplified CSV parsing: Date,Description,Debit,Credit,Balance
            const lines = fileContent.split('\n');
            // skip header
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = lines[i].split(',');
                if (cols.length >= 4) {
                    parsedLines.push({
                        valueDate: new Date(cols[0]),
                        bookingDate: new Date(cols[0]),
                        description: cols[1],
                        debit: parseFloat(cols[2]) || 0,
                        credit: parseFloat(cols[3]) || 0,
                        balance: parseFloat(cols[4]) || 0
                    });
                }
            }
        }

        // Save to DB
        return await prisma.bankStatement.create({
            data: {
                bankAccountId,
                statementNumber,
                statementDate,
                openingBalance,
                closingBalance,
                fileFormat,
                fileName,
                fileContent,
                importedBy: userId,
                lines: {
                    create: parsedLines.map(pl => ({
                        lineNumber: parsedLines.indexOf(pl) + 1,
                        valueDate: pl.valueDate,
                        bookingDate: pl.bookingDate,
                        description: pl.description,
                        debit: pl.debit,
                        credit: pl.credit,
                        balance: pl.balance || 0
                    }))
                }
            },
            include: { lines: true }
        });
    }
}
