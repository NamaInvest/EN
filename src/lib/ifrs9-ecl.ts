import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ifrs9-ecl' });

export class IFRS9Engine {
    
    private static async _getAccountId(codeOrKey: string, fallbackId: number): Promise<number> {
        const setting = await prisma.setting.findUnique({ where: { key: codeOrKey } });
        const codeToSearch = setting?.value || codeOrKey;
        const acc = await prisma.account.findFirst({ where: { code: codeToSearch } });
        return acc ? acc.id : fallbackId;
    }
    /**
     * Assess ECL for a single customer
     */
    static async assessCustomer(customerId: number, fiscalPeriodId: number, asOfDate: Date) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) throw new Error("Customer not found");

        // Calculate exposure (Open AR Invoices)
        const openInvoices = await prisma.salesInvoice.findMany({
            take: 100,
            where: {
                customerId,
                status: 'posted',
                remaining: { gt: 0 },
                date: { lte: asOfDate }
            }
        });

        let exposure = 0;
        let maxDaysPastDue = 0;

        for (const inv of openInvoices) {
            exposure += n(inv.remaining);
            const dueDate = new Date(inv.date);
            dueDate.setDate(dueDate.getDate() + 30); // Assuming 30 days terms
            
            if (asOfDate > dueDate) {
                const diffTime = Math.abs(asOfDate.getTime() - dueDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > maxDaysPastDue) {
                    maxDaysPastDue = diffDays;
                }
            }
        }

        if (exposure <= 0) return null;

        // Determine Stage
        let stage = 1;
        if (maxDaysPastDue > 90) stage = 3;
        else if (maxDaysPastDue > 30) stage = 2;

        // Determine ECL Model
        const segment = customer.type === 0 ? 'Customer' : 'General';
        let eclModel = await prisma.eCLModel.findFirst({
            where: { customerSegment: segment }
        });

        // Fallback defaults if model not found
        const s1 = eclModel ? n(eclModel.stage1Pct) : 0.01;
        const s2 = eclModel ? n(eclModel.stage2Pct) : 0.05;
        const s3 = eclModel ? n(eclModel.stage3Pct) : 0.20;

        let probabilityOfDefault = s1;
        if (stage === 2) probabilityOfDefault = s2;
        if (stage === 3) probabilityOfDefault = s3;

        const lossGivenDefault = 0.50; // Assume 50% recovery rate
        const eclAmount = exposure * probabilityOfDefault * lossGivenDefault;

        // Save Assessment
        const assessment = await prisma.eCLAssessment.create({
            data: {
                customerId,
                fiscalPeriodId,
                exposure,
                stage,
                probabilityOfDefault,
                lossGivenDefault,
                eclAmount
            }
        });

        return assessment;
    }

    /**
     * Run ECL for the entire portfolio
     */
    static async runPortfolioECL(fiscalPeriodId: number, asOfDate: Date, userId: string) {
        const customers = await prisma.customer.findMany({
            take: 100,
            where: { active: true }
        });

        const assessments = [];
        let totalECL = 0;

        for (const customer of customers) {
            const assessment = await this.assessCustomer(customer.id, fiscalPeriodId, asOfDate);
            if (assessment) {
                assessments.push(assessment);
                totalECL += n(assessment.eclAmount);
            }
        }

        // Generate Provision Journal Entry
        if (totalECL > 0) {
            const badDebtExpenseAccountId = await IFRS9Engine._getAccountId('acc_bad_debt_expense', 5010);
            const allowanceEclAccountId = await IFRS9Engine._getAccountId('acc_allowance_ecl', 1025);

            await prisma.journalEntry.create({
                data: {
                    entryNumber: `ECL-${fiscalPeriodId}-${Date.now()}`,
                    entryDate: asOfDate.toISOString(),
                    description: `IFRS 9 Expected Credit Loss Provision`,
                    status: 'posted',
                    totalDebit: totalECL,
                    totalCredit: totalECL,
                    createdBy: parseInt(userId, 10),
                    isReversal: false,
                    lines: {
                        create: [
                            {
                                accountId: badDebtExpenseAccountId,
                                debit: totalECL,
                                credit: 0,
                                description: 'ECL Provision Expense'
                            },
                            {
                                accountId: allowanceEclAccountId,
                                debit: 0,
                                credit: totalECL,
                                description: 'ECL Allowance'
                            }
                        ]
                    }
                }
            });
        }

        return {
            totalExposure: assessments.reduce((sum: any, a: any) => sum + a.exposure, 0),
            totalECL,
            customerCount: assessments.length,
            assessments
        };
    }
}
