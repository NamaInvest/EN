// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'statutory-reports-engine' });

const prisma = new PrismaClient();

export class StatutoryReportsEngine {
    
    /**
     * ZATCA VAT Return Calculation
     * Calculates the VAT liability based on Saudi standard 15% and zero-rated supplies.
     * Box numbers correspond to the official ZATCA VAT return form.
     */
    static async generateVATReturn(startDate: Date, endDate: Date): Promise<any> {
        // 1. Output Tax (Sales)
        const sales = await prisma.salesInvoice.findMany({
            take: 100,
            where: {
                issueDate: { gte: startDate, lte: endDate },
                status: { notIn: ['DRAFT', 'CANCELLED'] } // assuming non-draft invoices
            }
        });

        let box1StandardSales = 0; // Standard rated 15%
        let box1Vat = 0;
        let box2SalesToGCC = 0;
        let box3ZeroRatedSales = 0;
        let box4ExemptSales = 0;

        for (const invoice of sales) {
            // Simplified tax logic: In reality, tax rate is per invoice line
            const total = Number(invoice.totalAmount);
            const tax = Number(invoice.taxAmount);
            
            if (tax > 0) {
                // Assuming standard rate
                box1StandardSales += (total - tax);
                box1Vat += tax;
            } else {
                // Simplification for 0% or exempt
                // In full implementation, we check the specific Tax Category Code (Z, E, O)
                box3ZeroRatedSales += total;
            }
        }

        // 2. Input Tax (Purchases)
        const purchases = await prisma.purchaseInvoice.findMany({
            take: 100,
            where: {
                issueDate: { gte: startDate, lte: endDate },
                status: { notIn: ['DRAFT', 'CANCELLED'] }
            }
        });

        let box7StandardPurchases = 0;
        let box7Vat = 0;
        let box8Imports = 0; // Simplified
        let box9ZeroRatedPurchases = 0;

        for (const invoice of purchases) {
            const total = Number(invoice.totalAmount);
            const tax = Number(invoice.taxAmount);

            if (tax > 0) {
                box7StandardPurchases += (total - tax);
                box7Vat += tax;
            } else {
                box9ZeroRatedPurchases += total;
            }
        }

        const totalOutputVat = box1Vat;
        const totalInputVat = box7Vat;
        const netVatDue = totalOutputVat - totalInputVat;

        return {
            period: { startDate, endDate },
            outputTax: {
                box1: { description: 'Standard rated sales', amount: box1StandardSales, vat: box1Vat },
                box2: { description: 'Sales to GCC', amount: box2SalesToGCC, vat: 0 },
                box3: { description: 'Zero-rated sales', amount: box3ZeroRatedSales, vat: 0 },
                box4: { description: 'Exempt sales', amount: box4ExemptSales, vat: 0 },
                totalOutputVat
            },
            inputTax: {
                box7: { description: 'Standard rated purchases', amount: box7StandardPurchases, vat: box7Vat },
                box8: { description: 'Imports subject to VAT paid at customs', amount: box8Imports, vat: 0 },
                box9: { description: 'Zero-rated purchases', amount: box9ZeroRatedPurchases, vat: 0 },
                totalInputVat
            },
            netVatDue
        };
    }

    /**
     * Zakat Calculation (Approximate Base)
     * Calculates the Zakat base according to Saudi ZATCA rules:
     * Zakat Base = Equity + Long-term Liabilities - Fixed Assets (+/- Adjustments)
     * Zakat Due = Zakat Base * 2.5% (Approx 2.577% for Gregorian year)
     */
    static async calculateZakatEstimate(): Promise<any> {
        // Fetch Equity and Long Term Liability balances from GL
        // This is a simplified estimation model
        const glAccounts = await prisma.gLAccount.findMany({
            include: {
                balances: {
                    orderBy: { periodYear: 'desc' },
                    take: 1
                }
            }
        });

        let equity = 0;
        let longTermLiabilities = 0;
        let netProfit = 0; // Would come from P&L
        let fixedAssets = 0;

        for (const acc of glAccounts) {
            const balance = acc.balances[0]?.balance || 0;
            if (acc.type === 'equity') equity += Number(balance);
            if (acc.type === 'liability' && acc.code.startsWith('22')) longTermLiabilities += Number(balance); // Assumption based on code
            if (acc.type === 'asset' && acc.code.startsWith('11')) fixedAssets += Number(balance); // Fixed Assets
        }

        // Standard Zakat formula simplification
        // Zakat Base = (Capital + Reserves + Retained Earnings + Provisions + LT Loans) - (Fixed Assets + Investments)
        const zakatBase = (equity + longTermLiabilities + netProfit) - fixedAssets;
        
        // 2.577% for Gregorian year (365 days), 2.5% for Hijri year (354 days)
        const zakatRate = 0.02577; 
        const zakatDue = Math.max(0, zakatBase * zakatRate);

        return {
            components: {
                equity,
                longTermLiabilities,
                netProfit,
                fixedAssets
            },
            zakatBase,
            rate: '2.577% (Gregorian)',
            zakatDue
        };
    }

    /**
     * IFRS Financial Statements: Balance Sheet (Statement of Financial Position)
     */
    static async generateIFRSBalanceSheet(asOfDate: Date): Promise<any> {
        const glAccounts = await prisma.gLAccount.findMany({
            take: 100,
            include: {
                balances: {
                    where: {
                        periodMonth: asOfDate.getMonth() + 1,
                        periodYear: asOfDate.getFullYear()
                    }
                }
            }
        });

        const assets = { current: 0, nonCurrent: 0, details: [] };
        const liabilities = { current: 0, nonCurrent: 0, details: [] };
        const equity = { total: 0, details: [] };

        for (const acc of glAccounts) {
            const balance = Number(acc.balances[0]?.balance || 0);
            if (balance === 0) continue;

            if (acc.type === 'asset') {
                if (acc.code.startsWith('11')) {
                    assets.nonCurrent += balance;
                } else {
                    assets.current += balance;
                }
                assets.details.push({ name: acc.name, balance });
            } 
            else if (acc.type === 'liability') {
                if (acc.code.startsWith('22')) {
                    liabilities.nonCurrent += balance; // Assuming 22x are long-term
                } else {
                    liabilities.current += balance;
                }
                liabilities.details.push({ name: acc.name, balance });
            }
            else if (acc.type === 'equity') {
                equity.total += balance;
                equity.details.push({ name: acc.name, balance });
            }
        }

        const totalAssets = assets.current + assets.nonCurrent;
        const totalLiabilitiesAndEquity = liabilities.current + liabilities.nonCurrent + equity.total;

        return {
            asOfDate,
            assets: { ...assets, total: totalAssets },
            liabilities: { ...liabilities, total: liabilities.current + liabilities.nonCurrent },
            equity,
            totalLiabilitiesAndEquity,
            isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01
        };
    }
}
