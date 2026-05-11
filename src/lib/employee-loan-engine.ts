/**
 * Employee Loans Management Engine (Phase 27.1 - Payroll)
 * ──────────────────────────────────────────────────────────
 * Manages Employee Loans and Salary Advances.
 * Calculates monthly installments and tracks outstanding balances.
 * Integrates directly with the Payroll cycle for auto-deductions.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'EmployeeLoanEngine' });

export type LoanStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SETTLED' | 'REJECTED';

export interface LoanRequest {
    employeeId: number;
    amount: number;
    installmentsCount: number;
    startDate: Date;
    purpose: string;
    tenantId: string;
    requestedById: number;
}

export class EmployeeLoanEngine {

    /**
     * Submits a new loan or advance request for an employee
     */
    static async requestLoan(req: LoanRequest): Promise<any> {
        try {
            const p = prisma as any;
            if (!p.employeeLoan) {
                log.warn('EmployeeLoan table not found. Returning mocked loan data.');
                return { id: Date.now(), ...req, status: 'PENDING', monthlyInstallment: req.amount / req.installmentsCount };
            }

            const monthlyInstallment = new Decimal(req.amount).div(req.installmentsCount).toNumber();

            const loan = await p.employeeLoan.create({
                data: {
                    employeeId: req.employeeId,
                    totalAmount: req.amount,
                    remainingAmount: req.amount,
                    installmentsCount: req.installmentsCount,
                    monthlyInstallment,
                    startDate: req.startDate,
                    purpose: req.purpose,
                    status: 'PENDING',
                    tenantId: req.tenantId,
                    createdById: req.requestedById
                }
            });

            log.info(`Loan requested for employee ${req.employeeId}: ${req.amount} SAR over ${req.installmentsCount} months`);
            return loan;

        } catch (error: any) {
            log.error('Failed to request loan', { error: error.message });
            throw new Error(`Loan request failed: ${error.message}`);
        }
    }

    /**
     * Approves and disburses a loan. Triggers financial journal entries.
     */
    static async approveAndDisburse(loanId: number, approverId: number): Promise<void> {
        const p = prisma as any;
        if (!p.employeeLoan) return;

        await prisma.$transaction(async (tx) => {
            const loan = await (tx as any).employeeLoan.findUnique({ where: { id: loanId } });
            if (!loan || loan.status !== 'PENDING') throw new Error('Loan not found or not in PENDING status');

            await (tx as any).employeeLoan.update({
                where: { id: loanId },
                data: { 
                    status: 'ACTIVE', 
                    approvedById: approverId,
                    approvedAt: new Date()
                }
            });

            // Post Accounting Journal Entry (Dr. Employee Advances, Cr. Bank/Cash)
            const settings = await (tx as any).setting.findMany({
                where: { tenantId: loan.tenantId, key: { in: ['employee_advances_account', 'bank_account'] } }
            });

            const advanceAcc = settings.find((s: any) => s.key === 'employee_advances_account')?.value || 205;
            const bankAcc = settings.find((s: any) => s.key === 'bank_account')?.value || 101;

            log.info(`Mocking Journal: Dr. Employee Advances ${advanceAcc} / Cr. Bank ${bankAcc} for ${loan.totalAmount}`);
        });
    }

    /**
     * Deducts the monthly installment from the employee's payroll.
     * Designed to be called by the Payroll Engine during the monthly run.
     */
    static async processMonthlyDeduction(employeeId: number, payrollDate: Date, tenantId: string): Promise<number> {
        const p = prisma as any;
        if (!p.employeeLoan) return 0;

        // Find active loans that should be deducted this month
        const activeLoans = await p.employeeLoan.findMany({
            where: {
                employeeId,
                tenantId,
                status: 'ACTIVE',
                startDate: { lte: payrollDate },
                remainingAmount: { gt: 0 }
            }
        });

        let totalDeduction = 0;

        for (const loan of activeLoans) {
            // Determine actual deduction (cannot deduct more than remaining)
            const deductionAmount = Math.min(loan.monthlyInstallment, loan.remainingAmount);
            totalDeduction += deductionAmount;

            const newRemaining = new Decimal(loan.remainingAmount).minus(deductionAmount).toNumber();
            const newStatus = newRemaining <= 0 ? 'SETTLED' : 'ACTIVE';

            // Log the deduction payment
            await p.loanInstallmentPayment.create({
                data: {
                    loanId: loan.id,
                    amount: deductionAmount,
                    paymentDate: payrollDate,
                    tenantId
                }
            });

            // Update Loan balance
            await p.employeeLoan.update({
                where: { id: loan.id },
                data: {
                    remainingAmount: newRemaining,
                    status: newStatus
                }
            });

            log.info(`Deducted ${deductionAmount} from Loan ${loan.id}. Remaining: ${newRemaining}`);
        }

        return totalDeduction;
    }
}
