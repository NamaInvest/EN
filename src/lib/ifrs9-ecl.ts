import { prisma } from './prisma';

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
            exposure += inv.remaining;
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

        // Fallback model if not found
        if (!eclModel) {
            eclModel = {
                id: 0,
                customerSegment: 'Fallback',
                stage1Pct: 0.01, // 1%
                stage2Pct: 0.05, // 5%
                stage3Pct: 0.20, // 20%
                lookbackMonths: 12
            };
        }

        let probabilityOfDefault = eclModel.stage1Pct;
        if (stage === 2) probabilityOfDefault = eclModel.stage2Pct;
        if (stage === 3) probabilityOfDefault = eclModel.stage3Pct;

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
            where: { active: true }
        });

        const assessments = [];
        let totalECL = 0;

        for (const customer of customers) {
            const assessment = await this.assessCustomer(customer.id, fiscalPeriodId, asOfDate);
            if (assessment) {
                assessments.push(assessment);
                totalECL += assessment.eclAmount;
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
            totalExposure: assessments.reduce((sum, a) => sum + a.exposure, 0),
            totalECL,
            customerCount: assessments.length,
            assessments
        };
    }
}
